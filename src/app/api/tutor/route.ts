import { aiErrorResponse, askClaude } from '@/lib/ai/client'
import type { ChatMsg } from '@/lib/ai/types'

const SYSTEM_CODE = `Você é um tutor socrático de programação, exigente como um tech lead.
REGRA ABSOLUTA: você NUNCA dá a resposta nem escreve o código da solução.
Você faz UMA pergunta-guia curta (1 a 3 frases), em português do Brasil, que force o aluno a raciocinar sobre o próximo passo.
Se o código do aluno está no caminho certo, aprofunde. Se está errado, questione a premissa por trás dele.
Seja direto e específico ao código e ao briefing. Sem elogios vazios, sem "ótima pergunta".`

const SYSTEM_DESIGN = `Você é um tutor socrático de SYSTEM DESIGN (arquitetura de software), exigente como um staff engineer.
REGRA ABSOLUTA: você NUNCA entrega a arquitetura pronta nem desenha por ele.
Você faz UMA pergunta-guia curta (1 a 3 frases), em português do Brasil, que force o aluno a raciocinar sobre: quais componentes/serviços existem, onde cada dado vive, como distribuir/particionar/replicar os dados, trade-offs (consistência vs disponibilidade, latência), gargalos e escala.
Baseie-se no que está desenhado no canvas (descrito em texto) e no briefing. Sem elogios vazios.`

const HINT_CODE: Record<number, string> = {
  1: 'Dê uma pista NÍVEL 1 (conceitual): aponte a ÁREA em que ele deve pensar, sem citar o método nem a sintaxe.',
  2: 'Dê uma pista NÍVEL 2 (abordagem): aponte o método ou a estrutura a usar (ex.: filter, comparação de datas) sem escrever o código.',
  3: 'Dê uma pista NÍVEL 3 (quase explícita): descreva em palavras a forma da solução, mas ainda assim NÃO escreva o código pronto e peça pro aluno entender o porquê.',
}

const HINT_DESIGN: Record<number, string> = {
  1: 'Pista NÍVEL 1 (conceitual): aponte QUAL aspecto da arquitetura ele deve revisar (ex.: onde os dados vivem, gargalo de leitura/escrita), sem dar a estrutura.',
  2: 'Pista NÍVEL 2 (abordagem): indique o mecanismo a considerar (ex.: cache, fila, réplica de leitura, particionamento) sem desenhar por ele.',
  3: 'Pista NÍVEL 3 (quase explícita): descreva em palavras a forma da arquitetura, mas ainda assim NÃO entregue o diagrama pronto e peça pro aluno entender o porquê.',
}

const SOLVE_CODE = `Você é um tech lead. O aluno usou o recurso pago "Resolver pra mim" (último recurso, caro).
ENTREGUE a solução COMPLETA do desafio em português do Brasil: o código final correto, em um bloco de código, com comentários curtos. Depois, 2 a 3 linhas explicando o raciocínio principal. Sem enrolação.`

const SOLVE_DESIGN = `Você é um staff engineer. O aluno usou o recurso pago "Resolver pra mim" (último recurso, caro).
ENTREGUE a arquitetura recomendada em português do Brasil: liste os componentes/serviços, onde cada dado vive, o fluxo dos dados e o porquê das escolhas (trade-offs). Markdown curto e direto.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const domain: 'code' | 'design' =
      body.domain === 'design' ? 'design' : 'code'
    const mode: 'reply' | 'hint' | 'solve' =
      body.mode === 'hint'
        ? 'hint'
        : body.mode === 'solve'
          ? 'solve'
          : 'reply'
    const messages: ChatMsg[] = Array.isArray(body.messages)
      ? body.messages
      : []
    const work: string = body.code ?? ''
    const title: string = body.title ?? ''
    const briefing: string = body.briefing ?? ''

    const isDesign = domain === 'design'
    const hintGuide = isDesign ? HINT_DESIGN : HINT_CODE
    const system =
      mode === 'solve'
        ? isDesign
          ? SOLVE_DESIGN
          : SOLVE_CODE
        : isDesign
          ? SYSTEM_DESIGN
          : SYSTEM_CODE

    const transcript = messages
      .map((m) => `${m.role === 'ai' ? 'Tutor' : 'Aluno'}: ${m.text}`)
      .join('\n')

    const task =
      mode === 'solve'
        ? isDesign
          ? 'Entregue a arquitetura completa recomendada.'
          : 'Entregue a solução completa (código pronto + breve explicação).'
        : mode === 'hint'
          ? (hintGuide[Number(body.hintLevel) || 1] ?? hintGuide[1])
          : isDesign
            ? 'Responda com UMA pergunta-guia para o próximo passo do design.'
            : 'Responda com UMA pergunta-guia para o próximo passo do aluno.'

    const user = [
      `Desafio: ${title}`,
      `Briefing do cliente: ${briefing}`,
      '',
      isDesign ? 'Estado atual do diagrama (resumo):' : 'Código atual do aluno:',
      isDesign ? work || '(canvas vazio)' : `\`\`\`\n${work || '(vazio)'}\n\`\`\``,
      '',
      'Conversa até agora:',
      transcript || '(início — primeira interação)',
      '',
      task,
    ].join('\n')

    const text = await askClaude({
      system,
      user,
      maxTokens: mode === 'solve' ? 2048 : 800,
      effort: 'medium',
    })
    return Response.json({ text })
  } catch (e) {
    return aiErrorResponse(e)
  }
}
