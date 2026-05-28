import { aiErrorResponse, askClaude } from '@/lib/ai/client'
import type { ChatMsg } from '@/lib/ai/types'

const SYSTEM = `Você é um tutor socrático de programação, exigente como um tech lead.
REGRA ABSOLUTA: você NUNCA dá a resposta nem escreve o código da solução.
Você faz UMA pergunta-guia curta (1 a 3 frases), em português do Brasil, que force o aluno a raciocinar sobre o próximo passo.
Se o código do aluno está no caminho certo, aprofunde. Se está errado, questione a premissa por trás dele.
Seja direto e específico ao código e ao briefing. Sem elogios vazios, sem "ótima pergunta".`

const HINT_GUIDE: Record<number, string> = {
  1: 'Dê uma pista NÍVEL 1 (conceitual): aponte a ÁREA em que ele deve pensar, sem citar o método nem a sintaxe.',
  2: 'Dê uma pista NÍVEL 2 (abordagem): aponte o método ou a estrutura a usar (ex.: filter, comparação de datas) sem escrever o código.',
  3: 'Dê uma pista NÍVEL 3 (quase explícita): descreva em palavras a forma da solução, mas ainda assim NÃO escreva o código pronto e peça pro aluno entender o porquê.',
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const mode: 'reply' | 'hint' = body.mode === 'hint' ? 'hint' : 'reply'
    const messages: ChatMsg[] = Array.isArray(body.messages)
      ? body.messages
      : []
    const code: string = body.code ?? ''
    const title: string = body.title ?? ''
    const briefing: string = body.briefing ?? ''

    const transcript = messages
      .map((m) => `${m.role === 'ai' ? 'Tutor' : 'Aluno'}: ${m.text}`)
      .join('\n')

    const task =
      mode === 'hint'
        ? (HINT_GUIDE[Number(body.hintLevel) || 1] ?? HINT_GUIDE[1])
        : 'Responda com UMA pergunta-guia para o próximo passo do aluno.'

    const user = [
      `Desafio: ${title}`,
      `Briefing do cliente: ${briefing}`,
      '',
      'Código atual do aluno:',
      '```',
      code || '(vazio)',
      '```',
      '',
      'Conversa até agora:',
      transcript || '(início — primeira interação)',
      '',
      task,
    ].join('\n')

    const text = await askClaude({
      system: SYSTEM,
      user,
      maxTokens: 800,
      effort: 'medium',
    })
    return Response.json({ text })
  } catch (e) {
    return aiErrorResponse(e)
  }
}
