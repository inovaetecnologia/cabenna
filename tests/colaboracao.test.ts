import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
let db: PGlite;
let equipe: string;
let espaco: string;
let registro: string;
let versao = 1;
const uid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const rid = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const entrada = {
  tipo: 'nota',
  titulo: 'Privado',
  texto: 'Meu conteúdo',
  prazo: null,
  estado: 'A fazer',
  checklist: [],
  favorito: false,
  dados: {},
  espaco_id: null,
};
async function como<T>(n: number, acao: () => Promise<T>): Promise<T> {
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid(n)]);
  try {
    return await acao();
  } finally {
    await db.exec('reset role');
  }
}
async function rpc<T = unknown>(nome: string, args: unknown[] = []): Promise<T> {
  const params = args.map((_, i) => '$' + (i + 1)).join(',');
  const r = await db.query<{ valor: T }>(`select public.${nome}(${params}) as valor`, args);
  return r.rows[0]!.valor;
}
const salvar = (id: string, dados: unknown = entrada, v = 0, e: string | null = null) =>
  rpc<Record<string, any>>('cabenna_salvar_registro', [id, JSON.stringify(dados), v, e]);
const token = (n: number) => ('convite-cabenna-' + String(n).padStart(3, '0') + '-').repeat(5);
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`,
  );
  for (let n = 1; n <= 22; n++)
    await db.query('insert into auth.users values($1,$2,now())', [
      uid(n),
      `pessoa${n}@teste.invalid`,
    ]);
  for (const arquivo of [
    '0001_itens_pessoais.sql',
    '0002_espacos_planos_equipes.sql',
    '0003_registros_historico_agenda.sql',
    '0004_exportacao_e_atribuicoes.sql',
    '0005_foco_pessoal.sql',
    '0006_master_e_planos_conectados.sql',
  ])
    await db.exec(
      readFileSync(new URL('../supabase/migrations/' + arquivo, import.meta.url), 'utf8'),
    );
}, 30000);
afterAll(async () => db.close());
describe('organização pessoal e colaboração protegida', () => {
  it('anônimo não lê registros e não executa RPC', async () => {
    await db.exec('set role anon');
    try {
      await expect(db.query('select * from public.registros')).rejects.toThrow('permission denied');
      await expect(rpc('cabenna_criar_equipe', ['X'])).rejects.toThrow('permission denied');
    } finally {
      await db.exec('reset role');
    }
  });
  it('grátis cria documentos e protege registros pessoais', async () => {
    await como(1, () =>
      salvar(rid(1), {
        ...entrada,
        tipo: 'documento',
        dados: { documento: { type: 'doc', content: [] } },
      }),
    );
    const r = await como(2, () => db.query('select * from public.registros'));
    expect(r.rows).toHaveLength(0);
    await expect(como(2, () => salvar(rid(1), entrada, 1))).rejects.toThrow('CONFLITO');
  });
  it('teste Pro é concedido pelo servidor uma única vez', async () => {
    const p = await como(1, () =>
      rpc<{ codigo: string; historico_dias: number }>('cabenna_testar_pro'),
    );
    expect(p.codigo).toBe('pro');
    expect(p.historico_dias).toBe(90);
    await expect(como(1, () => rpc('cabenna_testar_pro'))).rejects.toThrow('TESTE_JA_UTILIZADO');
    await expect(
      como(1, () =>
        db.query("update public.assinaturas_pessoais set pago_ate=now()+interval '1 year'"),
      ),
    ).rejects.toThrow('permission denied');
  });
  it('expiração devolve plano gratuito sem excluir registros', async () => {
    await db.query(
      "update public.assinaturas_pessoais set teste_inicio=now()-interval '20 days',teste_fim=now()-interval '6 days' where usuario_id=$1",
      [uid(1)],
    );
    const p = await como(1, () => rpc<{ codigo: string; historico_dias: number }>('cabenna_plano'));
    expect(p.codigo).toBe('gratuito');
    expect(p.historico_dias).toBe(7);
    const r = await como(1, () => db.query('select * from public.registros'));
    expect(r.rows).toHaveLength(1);
  });
  it('não permite forjar perfil de cobrança ou gravar diretamente', async () => {
    await expect(
      como(1, () => db.query("insert into public.registros(titulo,tipo) values('x','nota')")),
    ).rejects.toThrow('permission denied');
    await expect(
      como(1, () => db.query('update public.catalogo_planos set participantes_max=99')),
    ).rejects.toThrow('permission denied');
  });
  it('dono cria equipe com teste e convites são vinculados ao e-mail', async () => {
    equipe = await como(1, () => rpc<string>('cabenna_criar_equipe', ['Inovae teste']));
    await como(1, () =>
      rpc('cabenna_convidar', [equipe, 'pessoa2@teste.invalid', 'administrador', token(2)]),
    );
    await expect(como(3, () => rpc('cabenna_aceitar_convite', [token(2)]))).rejects.toThrow(
      'CONVITE_INDISPONIVEL',
    );
    await como(2, () => rpc('cabenna_aceitar_convite', [token(2)]));
    await expect(como(2, () => rpc('cabenna_aceitar_convite', [token(2)]))).rejects.toThrow();
  });
  it('admin não vê área pessoal do dono nem espaço restrito sem concessão', async () => {
    espaco = await como(1, () =>
      rpc<string>('cabenna_criar_espaco', ['Reservado', '#7EAE92', equipe, true]),
    );
    const r = await como(1, () =>
      salvar(rid(2), { ...entrada, titulo: 'Restrito', espaco_id: espaco }, 0, equipe),
    );
    registro = r.id;
    const visiveis = await como(2, () => db.query('select * from public.registros'));
    expect(visiveis.rows).toHaveLength(0);
    await expect(
      como(2, () => salvar(registro, { ...entrada, espaco_id: espaco }, 1, equipe)),
    ).rejects.toThrow('ESPACO_SEM_PERMISSAO');
  });
  it('permissão de leitura não concede escrita e pode ser revogada', async () => {
    await como(1, () => rpc('cabenna_autorizar_espaco', [espaco, uid(2), false, false]));
    let r = await como(2, () => db.query('select * from public.registros'));
    expect(r.rows).toHaveLength(1);
    await expect(
      como(2, () => salvar(registro, { ...entrada, espaco_id: espaco }, 1, equipe)),
    ).rejects.toThrow();
    await como(1, () => rpc('cabenna_autorizar_espaco', [espaco, uid(2), true, false]));
    await como(2, () => salvar(registro, { ...entrada, espaco_id: espaco }, 1, equipe));
    versao = 2;
    await como(1, () => rpc('cabenna_autorizar_espaco', [espaco, uid(2), false, true]));
    r = await como(2, () => db.query('select * from public.registros'));
    expect(r.rows).toHaveLength(0);
  });
  it('histórico restaura como nova versão, não sobrescreve gravação concorrente', async () => {
    const r = await como(1, () =>
      rpc<Record<string, any>>('cabenna_restaurar_versao', [registro, versao, 1]),
    );
    expect(r.versao).toBe(3);
    await expect(
      como(1, () => salvar(registro, { ...entrada, espaco_id: espaco }, 2, equipe)),
    ).rejects.toThrow('CONFLITO');
  });
  it('convite restrito só dá acesso a espaços explicitamente concedidos', async () => {
    await como(1, () =>
      rpc('cabenna_convidar', [equipe, 'pessoa3@teste.invalid', 'convidado', token(3)]),
    );
    await como(3, () => rpc('cabenna_aceitar_convite', [token(3)]));
    await como(1, () => salvar(rid(3), entrada, 0, equipe));
    let r = await como(3, () => db.query('select * from public.registros'));
    expect(r.rows).toHaveLength(0);
    await como(1, () => rpc('cabenna_autorizar_espaco', [espaco, uid(3), false, false]));
    r = await como(3, () => db.query('select * from public.registros'));
    expect(r.rows).toHaveLength(1);
  });
  it('comentários respeitam autorização do conteúdo', async () => {
    await como(1, () => rpc('cabenna_comentar', [registro, 'Uma decisão do projeto']));
    const a = await como(2, () => db.query('select * from public.comentarios_registro'));
    expect(a.rows).toHaveLength(0);
    await expect(
      como(3, () => rpc('cabenna_comentar', [registro, 'Tentativa com leitura apenas'])),
    ).rejects.toThrow('SEM_PERMISSAO');
  });
  it('remoção revoga consultas da mesma sessão e preserva conteúdo de equipe', async () => {
    await como(1, () => rpc('cabenna_gerir_participante', [equipe, uid(2), null, true, null]));
    const r = await como(2, () => db.query('select * from public.equipes'));
    expect(r.rows).toHaveLength(0);
    await expect(como(2, () => salvar(rid(4), entrada, 0, equipe))).rejects.toThrow();
    const conteudo = await como(1, () =>
      db.query('select id from public.registros where equipe_id=$1', [equipe]),
    );
    expect(conteudo.rows.length).toBe(2);
  });
  it('não deixa a equipe sem proprietário', async () => {
    await expect(
      como(1, () => rpc('cabenna_gerir_participante', [equipe, uid(1), null, true, null])),
    ).rejects.toThrow('TRANSFIRA_A_PROPRIEDADE');
  });
  it('convites pendentes reservam vagas e o limite de 15 é respeitado', async () => {
    const e = await como(1, () => rpc<string>('cabenna_criar_equipe', ['Limite teste']));
    for (let n = 2; n <= 15; n++)
      await como(1, () =>
        rpc('cabenna_convidar', [e, `pessoa${n}@teste.invalid`, 'membro', token(100 + n)]),
      );
    await expect(
      como(1, () => rpc('cabenna_convidar', [e, 'pessoa16@teste.invalid', 'membro', token(116)])),
    ).rejects.toThrow('LIMITE_PARTICIPANTES');
    await como(2, () => rpc('cabenna_aceitar_convite', [token(102)]));
    await expect(
      como(1, () => rpc('cabenna_convidar', [e, 'pessoa16@teste.invalid', 'membro', token(116)])),
    ).rejects.toThrow('LIMITE_PARTICIPANTES');
  });
  it('recorrência mensal conserva dia 31 e não duplica ao reabrir', async () => {
    const t = {
      ...entrada,
      tipo: 'tarefa',
      prazo: '2027-01-31',
      dados: { recorrencia: 'mensal', fuso: 'America/Sao_Paulo' },
    };
    await como(4, () => salvar(rid(10), t));
    const concluida = await como(4, () => salvar(rid(10), { ...t, estado: 'Concluída' }, 1));
    const proxima = concluida.dados.proxima_ocorrencia as string;
    let r = await como(4, () =>
      db.query<{ prazo: string }>('select prazo::text from public.registros where id=$1', [
        proxima,
      ]),
    );
    expect(r.rows[0]?.prazo).toBe('2027-02-28');
    await como(4, () => salvar(proxima, { ...t, prazo: '2027-02-28', estado: 'Concluída' }, 1));
    r = await como(4, () =>
      db.query<{ prazo: string }>(
        "select prazo::text from public.registros where prazo='2027-03-31'",
      ),
    );
    expect(r.rows).toHaveLength(1);
    await como(4, () => salvar(rid(10), t, 2));
    await como(4, () => salvar(rid(10), { ...t, estado: 'Concluída' }, 3));
    const todos = await como(4, () => db.query('select id from public.registros'));
    expect(todos.rows).toHaveLength(3);
  });
  it('bloco de tempo é independente do prazo', async () => {
    await como(5, () =>
      salvar(rid(11), {
        ...entrada,
        tipo: 'tarefa',
        prazo: '2026-12-20',
        dados: { bloco_inicio: '2026-12-10T12:00:00Z', bloco_fim: '2026-12-10T13:00:00Z' },
      }),
    );
    const r = await como(5, () =>
      db.query<{ prazo: string }>('select prazo::text from public.registros'),
    );
    expect(r.rows[0]?.prazo).toBe('2026-12-20');
    await expect(
      como(5, () =>
        salvar(rid(12), {
          ...entrada,
          tipo: 'evento',
          dados: { inicio: '2026-12-10T14:00:00Z', fim: '2026-12-10T13:00:00Z' },
        }),
      ),
    ).rejects.toThrow('EVENTO_INVALIDO');
  });
  it('exportação pessoal não cruza contas e exportação de equipe exige proprietário', async () => {
    const pessoal = await como(1, () => rpc<any[]>('cabenna_exportar_contexto', [null]));
    expect(pessoal.every((r) => r.usuario_id === uid(1) && r.equipe_id === null)).toBe(true);
    await expect(como(3, () => rpc('cabenna_exportar_contexto', [equipe]))).rejects.toThrow(
      'SEM_PERMISSAO',
    );
    const grupo = await como(1, () => rpc<any[]>('cabenna_exportar_contexto', [equipe]));
    expect(grupo.every((r) => r.equipe_id === equipe)).toBe(true);
    expect(grupo).toHaveLength(2);
  });
  it('funções internas não são chamadas por clientes', async () => {
    await expect(
      como(1, () => rpc('cabenna_validar_entrada_interno', [JSON.stringify(entrada)])),
    ).rejects.toThrow('permission denied');
  });
  it('transferência de atribuições não concede acesso implícito a espaço restrito', async () => {
    await como(1, () =>
      rpc('cabenna_convidar', [equipe, 'pessoa6@teste.invalid', 'membro', token(6)]),
    );
    await como(6, () => rpc('cabenna_aceitar_convite', [token(6)]));
    await como(1, () => rpc('cabenna_autorizar_espaco', [espaco, uid(6), true, false]));
    await como(1, () =>
      salvar(
        rid(20),
        { ...entrada, espaco_id: espaco, dados: { responsavel_id: uid(6) } },
        0,
        equipe,
      ),
    );
    await como(1, () =>
      rpc('cabenna_convidar', [equipe, 'pessoa7@teste.invalid', 'membro', token(7)]),
    );
    await como(7, () => rpc('cabenna_aceitar_convite', [token(7)]));
    await expect(
      como(1, () => rpc('cabenna_gerir_participante', [equipe, uid(6), null, true, uid(7)])),
    ).rejects.toThrow('RESPONSAVEL_INVALIDO');
  });
  it('remoção limpa atribuição e gera versão de histórico', async () => {
    await como(1, () => rpc('cabenna_gerir_participante', [equipe, uid(6), null, true, null]));
    const r = await como(1, () =>
      db.query<any>('select * from public.registros where id=$1', [rid(20)]),
    );
    expect(r.rows[0].dados.responsavel_id).toBeUndefined();
    expect(r.rows[0].versao).toBe(2);
    const h = await como(1, () =>
      db.query('select * from public.versoes_registro where registro_id=$1', [rid(20)]),
    );
    expect(h.rows).toHaveLength(2);
  });
  it('Meu Dia é individual, mesmo numa tarefa compartilhada', async () => {
    await como(1, () => rpc('cabenna_definir_foco', [rid(3), '2026-12-20']));
    const a = await como(7, () => db.query('select * from public.focos_diarios'));
    expect(a.rows).toHaveLength(0);
    const b = await como(1, () => db.query('select * from public.focos_diarios'));
    expect(b.rows).toHaveLength(1);
    await expect(
      como(2, () => rpc('cabenna_definir_foco', [rid(3), '2026-12-20'])),
    ).rejects.toThrow('SEM_PERMISSAO');
  });
  it('equipe expirada mantém consulta e exportação, mas bloqueia escrita', async () => {
    await db.query(
      "update public.equipes set teste_inicio=now()-interval '20 days',teste_fim=now()-interval '6 days' where id=$1",
      [equipe],
    );
    const p = await como(1, () => rpc<any>('cabenna_plano', [equipe]));
    expect(p.estado).toBe('consulta');
    await expect(como(1, () => salvar(rid(21), entrada, 0, equipe))).rejects.toThrow(
      'EQUIPE_EM_CONSULTA',
    );
    await expect(como(1, () => rpc('cabenna_comentar', [registro, 'Não pode']))).rejects.toThrow(
      'SEM_PERMISSAO',
    );
    const r = await como(1, () => rpc<any[]>('cabenna_exportar_contexto', [equipe]));
    expect(r.length).toBeGreaterThan(0);
  });
});

describe('Master e planos conectados', () => {
  it('uma conta comum não pode promover a si mesma', async () => {
    await expect(
      como(20, () =>
        db.query('insert into public.administradores_produto(usuario_id) values($1)', [uid(20)]),
      ),
    ).rejects.toThrow('permission denied');
    await expect(como(20, () => rpc('cabenna_resumo_master'))).rejects.toThrow('SEM_PERMISSAO');
  });
  it('licença Master usa a maior capacidade, permanentemente, sem abrir privados', async () => {
    await db.exec(
      readFileSync(new URL('../supabase/admin/ativar_master.sql', import.meta.url), 'utf8').replace(
        'PREENCHA_EMAIL',
        'pessoa20@teste.invalid',
      ),
    );
    const p = await como(20, () => rpc<any>('cabenna_plano'));
    expect(p.master).toBe(true);
    expect(p.licenca_permanente).toBe(true);
    expect(p.estado).toBe('ativo');
    expect(p.teste_fim).toBeNull();
    const limite = await db.query<any>(
      'select max(armazenamento_bytes) as maximo from public.catalogo_planos',
    );
    expect(Number(p.armazenamento_bytes)).toBe(Number(limite.rows[0].maximo));
    const privados = await como(20, () => db.query('select * from public.registros'));
    expect(privados.rows).toHaveLength(0);
  });
  it('equipes de um proprietário Master permanecem ativas após o teste, mantendo autorização', async () => {
    const e = await como(20, () => rpc<string>('cabenna_criar_equipe', ['Equipe Master']));
    await db.query(
      "update public.equipes set teste_inicio=now()-interval '60 days',teste_fim=now()-interval '46 days' where id=$1",
      [e],
    );
    const p = await como(20, () => rpc<any>('cabenna_plano', [e]));
    expect(p.estado).toBe('ativo');
    await como(20, () => salvar(rid(30), entrada, 0, e));
    await expect(como(21, () => salvar(rid(31), entrada, 0, e))).rejects.toThrow();
  });
  it('plano conecta tarefas com versões e mantém o escopo de acesso', async () => {
    await como(21, () =>
      salvar(rid(40), {
        ...entrada,
        tipo: 'documento',
        titulo: 'Meu objetivo',
        dados: {
          objetivo: { resultado: 'Terminar um curso', data_alvo: '2027-05-10', situacao: 'ativo' },
        },
      }),
    );
    const t = await como(21, () =>
      salvar(rid(41), { ...entrada, tipo: 'tarefa', dados: { objetivo_id: rid(40) } }),
    );
    expect(t.dados.objetivo_id).toBe(rid(40));
    await expect(
      como(22, () =>
        salvar(rid(42), { ...entrada, tipo: 'tarefa', dados: { objetivo_id: rid(40) } }),
      ),
    ).rejects.toThrow('OBJETIVO_INDISPONIVEL');
    await como(21, () =>
      salvar(
        rid(40),
        {
          ...entrada,
          tipo: 'documento',
          dados: {
            objetivo: { resultado: 'Terminar dois cursos', data_alvo: null, situacao: 'ativo' },
          },
        },
        1,
      ),
    );
    const h = await como(21, () =>
      db.query<any>(
        'select conteudo from public.versoes_registro where registro_id=$1 and versao=2',
        [rid(40)],
      ),
    );
    expect(h.rows[0].conteudo.dados.objetivo.resultado).toBe('Terminar dois cursos');
  });
  it('vínculo não atravessa espaços com audiências diferentes', async () => {
    const esp = await como(21, () =>
      rpc<string>('cabenna_criar_espaco', ['Outro cantinho', '#8AA175', null, false]),
    );
    await expect(
      como(21, () =>
        salvar(rid(43), {
          ...entrada,
          tipo: 'tarefa',
          espaco_id: esp,
          dados: { objetivo_id: rid(40) },
        }),
      ),
    ).rejects.toThrow('OBJETIVO_ESPACO_DIFERENTE');
  });
  it('recorrência preserva o vínculo correto ao próximo passo', async () => {
    const d = {
      ...entrada,
      tipo: 'tarefa',
      prazo: '2027-01-10',
      dados: { objetivo_id: rid(40), recorrencia: 'diaria' },
    };
    await como(21, () => salvar(rid(44), d));
    const r = await como(21, () => salvar(rid(44), { ...d, estado: 'Concluída' }, 1));
    const seguinte = await como(21, () =>
      db.query<any>('select dados from public.registros where id=$1', [r.dados.proxima_ocorrencia]),
    );
    expect(seguinte.rows[0].dados.objetivo_id).toBe(rid(40));
  });
  it('revogação administrativa da licença devolve o benefício normal', async () => {
    await db.query('update public.administradores_produto set ativo=false where usuario_id=$1', [
      uid(20),
    ]);
    const p = await como(20, () => rpc<any>('cabenna_plano'));
    expect(p.master).toBe(false);
    expect(p.codigo).toBe('gratuito');
    await expect(como(20, () => rpc('cabenna_resumo_master'))).rejects.toThrow('SEM_PERMISSAO');
  });
});
