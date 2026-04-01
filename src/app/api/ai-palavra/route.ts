import { NextRequest, NextResponse } from 'next/server';

const PALAVRAS_BASE = [
  { texto: "O Senhor é o meu pastor e nada me faltará.", referencia: "Salmos 23:1" },
  { texto: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo o que nele crê não pereça, mas tenha a vida eterna.", referencia: "João 3:16" },
  { texto: "E conhecereis a verdade, e a verdade vos libertará.", referencia: "João 8:32" },
  { texto: "Ore sem cessar. Em todas as circunstâncias sejam agradecidos, pois esta é a vontade de Deus em Cristo Jesus para vocês.", referencia: "1 Tessalonicenses 5:17-18" },
  { texto: "O amor é paciente, o amor é benigno; o amor não é invejoso, não se vangloria, não se orgulha.", referencia: "1 Coríntios 13:4" },
  { texto: "Eu vim para que tenham vida e a tenham em abundância.", referencia: "João 10:10" },
  { texto: "Não se preocupem com nada, mas em todas as circunstâncias apresentem as suas orações a Deus em oração e súplica, com ação de graças.", referencia: "Filipenses 4:6" },
  { texto: "Deus é o nosso refúgio e a nossa força, auxílio presente nas tribulações.", referencia: "Salmos 46:1" },
  { texto: "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão, e não se cansarão; andarão, e não se fadigarão.", referencia: "Isaías 40:31" },
  { texto: "Onde está o teu irmão? Eu respondi: Não sei. Não sou eu guardião do meu irmão?", referencia: "Gênesis 4:9" },
  { texto: "Tudo o que pedirdes em meu nome, eu o farei, para que o Pai seja glorificado no Filho.", referencia: "João 14:13" },
  { texto: "Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês.", referencia: "Mateus 11:28" },
  { texto: "O SENHOR é misericordioso, e benigno; tardio em irar-se, e grande em misericórdia.", referencia: "Salmos 103:8" },
  { texto: "Confiai no SENHOR de todo o vosso coração, e não vos apoiéis no vosso próprio entendimento.", referencia: "Provérbios 3:5" },
  { texto: "Na verdade, na verdade vos digo que aquele que em mim crê, já tem vida eterna.", referencia: "João 6:47" },
];

const BIBLICAL_MESSAGES = [
  { tema: "palavra sobre amor e fé", mensagens: [
    { texto: "O amor é o cumprimento da lei inteira. Amem-se uns aos outros, como eu vos amei.", referencia: "João 13:34-35" },
    { texto: "A fé sem obras é morta. Mostra-me a tua fé sem as tuas obras, e eu te mostrarei a minha fé pelas minhas obras.", referencia: "Tiago 2:17-18" },
  ]},
  { tema: "palavra sobre esperança e perseverança", mensagens: [
    { texto: "Regozijemo-nos na esperança da glória de Deus. Não apenas isso, mas também nos regozijamos nas tribulações, sabendo que a tribulação produz perseverança.", referencia: "Romanos 5:2-3" },
    { texto: "Bem-aventurado o homem que suporta a provação, porque depois de aprovado receberá a coroa da vida que o Senhor prometeu aos que o amam.", referencia: "Tiago 1:12" },
  ]},
  { tema: "palavra sobre comunhão e unidade na igreja", mensagens: [
    { texto: "Eram unânimes em estar juntos no templo, e, partindo o pão de casa em casa, tomavam o seu alimento com alegria e singeleza de coração.", referencia: "Atos 2:46" },
    { texto: "Observai que haja no corpo de Cristo, que é a igreja, não divisão, mas que os membros uns dos outros tenham o mesmo cuidado uns pelos outros.", referencia: "1 Coríntios 12:25" },
  ]},
  { tema: "palavra sobre cura e restauração", mensagens: [
    { texto: "Ele tirou as nossas enfermidades e carregou as nossas doenças.", referencia: "Mateus 8:17" },
    { texto: "O SENHOR te abençoe e te guarde; o SENHOR faça resplandecer o seu rosto sobre ti e te favoreça; o SENHOR levante sobre ti a sua face e te dê a paz.", referencia: "Números 6:24-26" },
  ]},
  { tema: "palavra sobre paz e confiança em Deus", mensagens: [
    { texto: "Deixo convosco a paz; não vos dou como o mundo dá. Não se perturbe o vosso coração, nem tenha medo.", referencia: "João 14:27" },
    { texto: "Lançai sobre ele toda a vossa ansiedade, porque ele tem cuidado de vocês.", referencia: "1 Pedro 5:7" },
  ]},
  { tema: "palavra sobre adoração e louvor", mensagens: [
    { texto: "Enterneceu-se Jesus por eles e disse: Se o queres, podes purificá-los.", referencia: "Mateus 8:2-3" },
    { texto: "Daquele dia e daquela hora ninguém sabe, nem os anjos no céu, nem o Filho, senão o Pai.", referencia: "Marcos 13:32" },
  ]},
  { tema: "palavra sobre família e relacionamentos", mensagens: [
    { texto: "Maridos, amai vossas mulheres, como também Cristo amou a igreja, e a si mesmo se entregou por ela.", referencia: "Efésios 5:25" },
    { texto: "Instruí o menino no caminho em que deve andar, e, ainda quando for velho, não se desviará dele.", referencia: "Provérbios 22:6" },
  ]},
  { tema: "palavra sobre evangelismo e missão", mensagens: [
    { texto: "Ide por todo o mundo, pregai o evangelho a toda a criatura.", referencia: "Marcos 16:15" },
    { texto: "Mas recebereis poder, ao descer sobre vós o Espírito Santo, e sereis minhas testemunhas em Jerusalém, em toda a Judá e Samaria, e até os confins da terra.", referencia: "Atos 1:8" },
  ]},
  { tema: "palavra sobre sabedoria e conhecimento", mensagens: [
    { texto: "Se algum de vós falta de sabedoria, peça-a a Deus, que a todos liberalmente dá, e não repreenderá, e ser-lhe-á dada.", referencia: "Tiago 1:5" },
    { texto: "O temor do SENHOR é o princípio da sabedoria, e o conhecimento dos santos é o entendimento.", referencia: "Provérbios 9:10" },
  ]},
  { tema: "palavra sobre força e coragem", mensagens: [
    { texto: "Sede fortes e corajosos. Não temais, nem vos espanteis, porque o SENHOR vosso Deus é convosco, em qualquer lugar onde estiverdes.", referencia: "1 Crônicas 28:20" },
    { texto: "O SENHOR é a minha luz e a minha salvação; de quem temerei? O SENHOR é a fortaleza da minha vida; de quem me assustarei?", referencia: "Salmos 27:1" },
  ]},
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    // Simple deterministic response based on the prompt
    // This avoids needing an external AI API while still providing variety
    
    // Find relevant messages based on prompt or use base palavras
    let selectedMessage;
    
    const normalizedPrompt = (prompt || "").toLowerCase();
    const found = BIBLICAL_MESSAGES.find(m => 
      normalizedPrompt.includes(m.tema.toLowerCase().replace("palavra sobre ", ""))
    );
    
    if (found) {
      selectedMessage = getRandomItem(found.mensagens);
    } else {
      // Use random base palavra
      selectedMessage = getRandomItem(PALAVRAS_BASE);
    }

    // Add some variation - occasionally use a different reference
    if (Math.random() > 0.7) {
      selectedMessage = getRandomItem(PALAVRAS_BASE);
    }

    return NextResponse.json({
      texto: selectedMessage.texto,
      referencia: selectedMessage.referencia
    });

  } catch (error) {
    console.error('Error generating palavra:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar palavra do dia' },
      { status: 500 }
    );
  }
}
