import React, { useState } from 'react';
import { View } from 'react-native';
import { Plano } from '../lib/contextos';
import { Cores } from '../theme/cores';
import { Texto, Botao } from './ui';
import { iniciarTeste } from '../data/cabenna';
export default function Planos({
  plano,
  equipe,
  cores,
  atualizar,
  criarEquipe,
}: {
  plano: Plano | null;
  equipe: boolean;
  cores: Cores;
  atualizar: () => void;
  criarEquipe: () => void;
}) {
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  if (plano?.licenca_permanente)
    return (
      <View style={{ gap: 20 }}>
        <Texto titulo style={{ fontSize: 30, lineHeight: 40, color: cores.texto }}>
          {plano.master ? 'Master Inovae' : 'Equipes com licença permanente'}
        </Texto>
        <Texto style={{ fontSize: 14, lineHeight: 25, color: cores.secundario }}>
          Sua licença é permanente, sem término de teste ou renovação. A capacidade acompanha o
          catálogo configurado no servidor.
        </Texto>
        <View style={{ padding: 23, borderRadius: 16, backgroundColor: cores.suave, gap: 12 }}>
          <Texto style={{ color: cores.texto }}>✓ Histórico de {plano.historico_dias} dias</Texto>
          <Texto style={{ color: cores.texto }}>
            ✓ Capacidade de conteúdo: {(plano.armazenamento_bytes / 1024 / 1024 / 1024).toFixed(0)}{' '}
            GB
          </Texto>
          <Texto style={{ color: cores.texto }}>✓ Planos, documentos, tarefas e calendário</Texto>
          <Texto style={{ color: cores.texto }}>
            ✓ Recursos de equipe com permissões por contexto
          </Texto>
        </View>
        <Botao cores={cores} onPress={criarEquipe}>
          Criar uma equipe
        </Botao>
        <Texto style={{ fontSize: 12, color: cores.secundario }}>
          A licença libera os recursos disponíveis. Anexos, cofre e contratação paga continuam em
          preparação.
        </Texto>
      </View>
    );
  return (
    <View style={{ gap: 24 }}>
      <Texto titulo style={{ fontSize: 30, lineHeight: 40, color: cores.texto }}>
        Seu espaço pode crescer com você.
      </Texto>
      <Texto style={{ color: cores.secundario }}>
        Contexto atual: {plano?.nome ?? '…'} ·{' '}
        {plano?.estado === 'teste'
          ? 'teste até ' + new Date(plano.teste_fim!).toLocaleDateString('pt-BR')
          : plano?.estado === 'consulta'
            ? 'somente consulta'
            : plano?.estado === 'ativo'
              ? 'ativo'
              : 'gratuito'}
      </Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {[
          {
            nome: 'Free',
            frase: 'Um lugar para começar. E continuar.',
            linhas: [
              'Notas, documentos, listas e tarefas',
              'Agenda interna e Meu Dia',
              'Espaços pessoais e etiquetas',
              'Histórico de 7 dias',
            ],
            acao: 'Você já começa aqui',
          },
          {
            nome: 'Pro',
            frase: 'Mais espaço para a sua vida inteira.',
            linhas: [
              'Tudo do Free',
              'Histórico de 90 dias',
              'Cota de conteúdo maior',
              'Teste pessoal de 14 dias, uma vez por conta',
            ],
            acao: 'Testar Pro por 14 dias',
          },
          {
            nome: 'Equipes',
            frase: 'O trabalho junto. O pessoal, pessoal.',
            linhas: [
              'Até 15 participantes por equipe',
              'Espaços abertos e restritos',
              'Papéis, responsáveis e comentários',
              'Histórico de 90 dias · teste de 14 dias',
            ],
            acao: 'Criar uma equipe',
          },
        ].map((p, i) => (
          <View
            key={p.nome}
            style={{
              flex: 1,
              minWidth: 240,
              padding: 24,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: cores.borda,
              backgroundColor: cores.painel,
              gap: 16,
            }}
          >
            <Texto titulo style={{ fontSize: 24, color: cores.texto }}>
              {p.nome}
            </Texto>
            <Texto style={{ color: cores.secundario }}>{p.frase}</Texto>
            {p.linhas.map((l) => (
              <Texto key={l} style={{ color: cores.texto }}>
                ✓ {l}
              </Texto>
            ))}
            {i === 1 ? (
              <Botao
                cores={cores}
                disabled={ocupado || equipe || !!plano?.teste_utilizado || plano?.codigo === 'pro'}
                onPress={() => {
                  setOcupado(true);
                  void iniciarTeste()
                    .then(atualizar)
                    .catch((e) => setErro(e.message))
                    .finally(() => setOcupado(false));
                }}
              >
                {plano?.teste_utilizado && !equipe ? 'Teste já utilizado' : p.acao}
              </Botao>
            ) : i === 2 ? (
              <Botao cores={cores} onPress={criarEquipe}>
                {p.acao}
              </Botao>
            ) : (
              <Texto style={{ color: cores.secundario }}>{p.acao}</Texto>
            )}
          </View>
        ))}
      </View>
      <Texto style={{ color: cores.secundario }}>
        Os testes não pedem cartão e não geram cobrança automática. A contratação paga ainda está em
        preparação. Ao terminar o teste Pro, sua conta volta ao Free; equipes ficam em consulta.
        Seus registros permanecem acessíveis conforme suas permissões.
      </Texto>
      {!!erro && <Texto style={{ color: cores.erro }}>{erro}</Texto>}
    </View>
  );
}
