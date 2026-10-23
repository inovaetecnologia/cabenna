import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { Equipe, Participante, Espaco, Convite } from '../lib/contextos';
import { Cores } from '../theme/cores';
import { Texto, Botao } from './ui';
import { Campo, Escolha } from './formulario';
import {
  convidar,
  carregarConvites,
  revogarConvite,
  gerirParticipante,
  autorizarEspaco,
  carregarPermissoes,
} from '../data/cabenna';
export default function GestaoEquipe({
  equipe,
  participantes,
  espacos,
  usuario,
  cores,
  atualizar,
  criar,
}: {
  equipe: Equipe | null;
  participantes: Participante[];
  espacos: Espaco[];
  usuario: string;
  cores: Cores;
  atualizar: () => void;
  criar: () => void;
}) {
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState('membro');
  const [convites, setConvites] = useState<Convite[]>([]);
  const [link, setLink] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState<{ p: Participante; acao: string } | null>(null);
  const [espaco, setEspaco] = useState('');
  const [pessoa, setPessoa] = useState('');
  const [permissao, setPermissao] = useState('leitura');
  const [aviso, setAviso] = useState('');
  const [permissoes, setPermissoes] = useState<{ usuario_id: string; pode_editar: boolean }[]>([]);
  const eu = participantes.find((p) => p.usuario_id === usuario);
  const admin = eu && ['proprietario', 'administrador'].includes(eu.papel);
  const dono = eu?.papel === 'proprietario';
  useEffect(() => {
    setPermissoes([]);
    if (espaco)
      void carregarPermissoes(espaco)
        .then(setPermissoes)
        .catch((e) => setErro(e.message));
  }, [espaco]);
  const carregar = async () => {
    if (equipe && admin) {
      try {
        setConvites(await carregarConvites(equipe.id));
      } catch (e) {
        setErro((e as Error).message);
      }
    }
  };
  useEffect(() => {
    setConvites([]);
    setLink('');
    void carregar();
  }, [equipe?.id, admin]);
  const executar = async (f: () => Promise<unknown>) => {
    setOcupado(true);
    setErro('');
    setAviso('');
    try {
      await f();
      await carregar();
      atualizar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };
  if (!equipe)
    return (
      <View style={{ gap: 20, maxWidth: 650 }}>
        <Texto titulo style={{ fontSize: 30, lineHeight: 40, color: cores.texto }}>
          Boas ideias merecem companhia.
        </Texto>
        <Texto style={{ color: cores.secundario }}>
          Crie um contexto para até 15 pessoas. Convide pelo e-mail, distribua responsabilidades e
          mantenha as decisões perto das tarefas. Seus registros pessoais continuam só seus.
        </Texto>
        <Botao cores={cores} onPress={criar}>
          Criar equipe · testar por 14 dias
        </Botao>
      </View>
    );
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Texto titulo style={{ fontSize: 28, lineHeight: 38, color: cores.texto }}>
          {equipe.nome}
        </Texto>
        <Texto style={{ color: cores.secundario }}>
          {participantes.length}/15 participantes · seu papel: {eu?.papel}. Convites pendentes
          também reservam vagas.
        </Texto>
      </View>
      {admin && (
        <View style={{ padding: 22, borderRadius: 14, backgroundColor: cores.painel, gap: 14 }}>
          <Texto titulo style={{ fontSize: 18, color: cores.texto }}>
            Chame quem faz parte
          </Texto>
          <Campo label="E-mail da pessoa convidada" valor={email} mudar={setEmail} cores={cores} />
          <Escolha
            label="Papel no convite"
            valor={papel}
            mudar={setPapel}
            cores={cores}
            opcoes={[
              { valor: 'membro', nome: 'Membro' },
              { valor: 'administrador', nome: 'Administrador' },
              { valor: 'convidado', nome: 'Convidado restrito' },
            ]}
          />
          <Botao
            cores={cores}
            disabled={ocupado || !/^\S+@\S+\.\S+$/.test(email.trim())}
            onPress={() =>
              void executar(async () => {
                const token = Crypto.randomUUID() + Crypto.randomUUID();
                await convidar(equipe.id, email.trim(), papel, token);
                setLink(
                  (Platform.OS === 'web' ? window.location.origin : '') +
                    '/app?convite=' +
                    encodeURIComponent(token),
                );
                setEmail('');
              })
            }
          >
            Gerar convite seguro
          </Botao>
          <Texto style={{ color: cores.secundario, fontSize: 12 }}>
            Compartilhe o link com a pessoa. O aceite exige entrar com o mesmo e-mail confirmado.
            Convidados só acessam espaços que você liberar.
          </Texto>
          {!!link && (
            <View style={{ padding: 16, backgroundColor: cores.suave, gap: 10, borderRadius: 10 }}>
              <Texto style={{ color: cores.texto }}>
                Copie agora. O link não será exibido novamente.
              </Texto>
              <Texto selectable style={{ fontSize: 12, color: cores.texto }}>
                {link}
              </Texto>
              <Botao
                cores={cores}
                secundario
                onPress={() => {
                  if (Platform.OS === 'web')
                    void navigator.clipboard
                      .writeText(link)
                      .then(() => setAviso('Link copiado.'))
                      .catch(() => setAviso('Selecione o link acima e copie manualmente.'));
                }}
              >
                Copiar link
              </Botao>
            </View>
          )}
          {convites
            .filter((c) => c.estado === 'pendente' && new Date(c.vence_em) > new Date())
            .map((c) => (
              <View
                key={c.id}
                style={{ gap: 8, borderTopWidth: 1, borderColor: cores.borda, paddingTop: 14 }}
              >
                <Texto style={{ color: cores.texto }}>
                  {c.email} · {c.papel}
                </Texto>
                <Botao
                  cores={cores}
                  secundario
                  disabled={ocupado}
                  onPress={() => void executar(() => revogarConvite(c.id))}
                >
                  Revogar convite
                </Botao>
              </View>
            ))}
        </View>
      )}
      <Texto titulo style={{ fontSize: 20, color: cores.texto }}>
        Pessoas e responsabilidades
      </Texto>
      {participantes.map((p) => (
        <View
          key={p.usuario_id}
          style={{
            padding: 18,
            borderWidth: 1,
            borderColor: cores.borda,
            borderRadius: 12,
            gap: 10,
          }}
        >
          <Texto style={{ color: cores.texto }}>
            {p.email}
            {p.usuario_id === usuario ? ' · você' : ''}
          </Texto>
          <Texto style={{ color: cores.secundario, fontSize: 12 }}>{p.papel}</Texto>
          {dono && p.usuario_id !== usuario && (
            <Escolha
              label="Alterar papel"
              cores={cores}
              valor={p.papel}
              mudar={(v) => setConfirmar({ p, acao: v })}
              opcoes={[
                { valor: 'membro', nome: 'Membro' },
                { valor: 'administrador', nome: 'Administrador' },
                { valor: 'convidado', nome: 'Convidado' },
                { valor: 'proprietario', nome: 'Transferir propriedade' },
              ]}
            />
          )}
          {p.papel !== 'proprietario' && (admin || p.usuario_id === usuario) && (
            <Botao
              cores={cores}
              secundario
              disabled={ocupado}
              onPress={() => setConfirmar({ p, acao: 'remover' })}
            >
              {p.usuario_id === usuario ? 'Sair da equipe' : 'Remover participante'}
            </Botao>
          )}
        </View>
      ))}
      {confirmar && (
        <View style={{ padding: 22, backgroundColor: cores.suave, gap: 12, borderRadius: 12 }}>
          <Texto titulo style={{ color: cores.texto }}>
            Confirmar{' '}
            {confirmar.acao === 'remover'
              ? 'remoção'
              : confirmar.acao === 'proprietario'
                ? 'transferência de propriedade'
                : 'alteração de papel'}
            ?
          </Texto>
          <Texto style={{ color: cores.texto }}>
            {confirmar.p.email}.{' '}
            {confirmar.acao === 'remover'
              ? 'A pessoa perde o acesso e suas atribuições são retiradas. O conteúdo da equipe é preservado.'
              : confirmar.acao === 'proprietario'
                ? 'Você passará a administrador. A nova pessoa proprietária controlará a equipe.'
                : 'As permissões serão recalculadas pelo servidor. Ao mudar para convidado, os acessos explícitos precisam ser concedidos novamente.'}
          </Texto>
          <Botao
            cores={cores}
            disabled={ocupado}
            onPress={() =>
              void executar(async () => {
                await gerirParticipante(
                  equipe.id,
                  confirmar.p.usuario_id,
                  confirmar.acao === 'remover' ? null : confirmar.acao,
                  confirmar.acao === 'remover',
                );
                setConfirmar(null);
              })
            }
          >
            Confirmar alteração
          </Botao>
          <Botao cores={cores} secundario onPress={() => setConfirmar(null)}>
            Cancelar
          </Botao>
        </View>
      )}
      {admin && (
        <View style={{ padding: 22, backgroundColor: cores.painel, gap: 16, borderRadius: 14 }}>
          <Texto titulo style={{ fontSize: 20, color: cores.texto }}>
            Acesso aos espaços restritos
          </Texto>
          <Texto style={{ color: cores.secundario }}>
            Administradores também precisam de acesso explícito a um espaço restrito para
            gerenciá-lo. Revogar o próprio acesso é bloqueado.
          </Texto>
          <Escolha
            label="Espaço visível para você"
            valor={espaco}
            mudar={setEspaco}
            cores={cores}
            opcoes={espacos.map((e) => ({ valor: e.id, nome: e.nome }))}
          />
          {permissoes.map((p) => (
            <Texto key={p.usuario_id} style={{ color: cores.secundario, fontSize: 12 }}>
              {participantes.find((m) => m.usuario_id === p.usuario_id)?.email ?? 'Participante'} ·{' '}
              {p.pode_editar ? 'pode editar' : 'pode consultar'}
            </Texto>
          ))}
          <Escolha
            label="Participante"
            valor={pessoa}
            mudar={setPessoa}
            cores={cores}
            opcoes={participantes.map((p) => ({ valor: p.usuario_id, nome: p.email }))}
          />
          <Escolha
            label="Permissão"
            valor={permissao}
            mudar={setPermissao}
            cores={cores}
            opcoes={[
              { valor: 'leitura', nome: 'Pode consultar' },
              { valor: 'escrita', nome: 'Pode editar' },
              { valor: 'revogar', nome: 'Revogar acesso explícito' },
            ]}
          />
          <Botao
            cores={cores}
            disabled={ocupado || !espaco || !pessoa}
            onPress={() =>
              void executar(async () => {
                await autorizarEspaco(
                  espaco,
                  pessoa,
                  permissao === 'escrita',
                  permissao === 'revogar',
                );
                setPermissoes(await carregarPermissoes(espaco));
                setAviso('Permissão atualizada.');
              })
            }
          >
            Aplicar permissão
          </Botao>
        </View>
      )}
      {!!erro && (
        <Texto accessibilityRole="alert" style={{ color: cores.erro }}>
          {erro}
        </Texto>
      )}
      {!!aviso && (
        <Texto accessibilityLiveRegion="polite" style={{ color: cores.texto }}>
          {aviso}
        </Texto>
      )}
    </View>
  );
}
