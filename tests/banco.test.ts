import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
let db: PGlite;
const a = '10000000-0000-4000-8000-000000000001',
  b = '10000000-0000-4000-8000-000000000002';
const id = '20000000-0000-4000-8000-000000000001';
const entrada = {
  tipo: 'nota',
  titulo: 'Somente A',
  texto: 'Privado',
  prazo: null,
  estado: 'A fazer',
  checklist: [],
  favorito: false,
};
async function como(usuario: string, acao: () => Promise<unknown>) {
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [usuario]);
  try {
    return await acao();
  } finally {
    await db.exec('reset role');
  }
}
async function salvar(versao = 0, dados = entrada, item = id) {
  return db.query('select public.salvar_item_pessoal($1,$2::jsonb,$3) as item', [
    item,
    JSON.stringify(dados),
    versao,
  ]);
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon; insert into auth.users values('${a}'),('${b}');`,
  );
  await db.exec(
    readFileSync(
      new URL('../supabase/migrations/0001_itens_pessoais.sql', import.meta.url),
      'utf8',
    ),
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
describe('autorização e concorrência no PostgreSQL', () => {
  it('A cria registro com proprietário atribuído pelo servidor', async () => {
    const r = (await como(a, () => salvar())) as { rows: { item: { titulo: string } }[] };
    expect(r.rows[0]?.item.titulo).toBe('Somente A');
  });
  it('A lê seu registro', async () => {
    const r = (await como(a, () => db.query('select * from public.itens_pessoais'))) as {
      rows: unknown[];
    };
    expect(r.rows).toHaveLength(1);
  });
  it('B não lê registro de A por RLS', async () => {
    const r = (await como(b, () => db.query('select * from public.itens_pessoais'))) as {
      rows: unknown[];
    };
    expect(r.rows).toHaveLength(0);
  });
  it('B não modifica nem restaura objeto de A por RPC', async () => {
    await expect(como(b, () => salvar(1))).rejects.toThrow('CONFLITO');
    await expect(
      como(b, () => db.query("select public.organizar_item_pessoal($1,1,'restaurar')", [id])),
    ).rejects.toThrow();
  });
  it('B não descobre conteúdo tentando reutilizar UUID', async () => {
    await expect(como(b, () => salvar(0))).rejects.toThrow('CONFLITO');
  });
  it('REST não pode escrever diretamente ou forjar dono', async () => {
    await expect(
      como(a, () =>
        db.query('update public.itens_pessoais set usuario_id=$1 where id=$2', [b, id]),
      ),
    ).rejects.toThrow('permission denied');
  });
  it('atualização incrementa versão e rejeita gravação antiga', async () => {
    await como(a, () => salvar(1, { ...entrada, titulo: 'Nova versão' }));
    await expect(como(a, () => salvar(1))).rejects.toThrow('CONFLITO');
  });
  it('valida dados no servidor mesmo com cliente contornado', async () => {
    await expect(como(a, () => salvar(2, { ...entrada, titulo: '' }))).rejects.toThrow();
    await expect(como(a, () => salvar(2, { ...entrada, tipo: 'cofre' }))).rejects.toThrow();
    await expect(
      como(a, () =>
        salvar(2, {
          ...entrada,
          checklist: [{ id: '1', texto: '', feita: false }],
        } as typeof entrada),
      ),
    ).rejects.toThrow('LISTA_INVALIDA');
  });
  it('exclusão lógica bloqueia edição; restauração preserva conteúdo', async () => {
    await como(a, () => db.query("select public.organizar_item_pessoal($1,2,'excluir')", [id]));
    await expect(como(a, () => salvar(3))).rejects.toThrow('CONFLITO');
    await como(a, () => db.query("select public.organizar_item_pessoal($1,3,'restaurar')", [id]));
    const r = (await como(a, () =>
      db.query<{ titulo: string; versao: number }>(
        'select titulo,versao from public.itens_pessoais',
      ),
    )) as { rows: { titulo: string; versao: number }[] };
    expect(r.rows[0]).toEqual({ titulo: 'Nova versão', versao: 4 });
  });
  it('anônimo não executa função nem consulta tabela', async () => {
    await db.exec('set role anon');
    try {
      await expect(salvar()).rejects.toThrow('permission denied');
      await expect(db.query('select * from public.itens_pessoais')).rejects.toThrow(
        'permission denied',
      );
    } finally {
      await db.exec('reset role');
    }
  });
});
