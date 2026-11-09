# Roteiro para apresentação em até 9 minutos

Versão curta da apresentação final. Os tempos abaixo somam **7min55s de fala**. Reserve cerca de **40 segundos** para transições e pausas: total estimado **8min35s**. As três lâminas de referências ficam visíveis ao final, sem leitura integral.

A duração é uma estimativa; ensaie com cronômetro, sobretudo os dois exemplos locais.

## Lâmina 1 — Abertura (00:15)

Boa noite. Este trabalho estende um modelo de classificação de AVC com SHAP. Vou mostrar o desempenho que obtivemos e, principalmente, como a técnica explica as previsões.

## Lâmina 2 — Objetivo (00:30)

O artigo base apresentou Random Forest com acurácia próxima de 97%, mas não explicou por que cada pessoa foi classificada. Minha extensão treina um RF em Python e aplica TreeExplainer para analisar as contribuições globais e individuais. O foco é entender a saída do modelo.

## Lâmina 3 — Dados e ressalva (00:35)

A coorte que extraí do CSV tem 4.194 adultos, contra 3.254 no artigo, e há 180 valores de IMC ausentes. A procedência deste CSV também foi questionada em estudo posterior. Por isso, a comparação não é uma reprodução numérica exata. Esta é a principal ressalva sobre os dados.

## Lâmina 4 — Treino (00:45)

Para avaliar sem vazamento, separei 20% do CSV para teste antes da imputação e do SMOTENC. O balanceamento ocorreu só no treino; as categorias foram codificadas e o RF usou 200 árvores. O teste preservou 839 registros originais, com 49 positivos. Assim, avaliamos pessoas não sintetizadas por nós.

## Lâmina 5 — Resultado do RF (00:50)

No teste, o RF encontrou 9 dos 49 positivos e perdeu 40. A acurácia foi 87,4%, mas isolada engana: prever sempre sem AVC acertaria 94,16% e não encontraria nenhum caso. O recall positivo de 0,184 e o F1 de 0,145 revelam a limitação. Os números ficaram abaixo dos publicados, em coortes e protocolos diferentes.

## Lâmina 6 — Como SHAP funciona (00:55)

O SHAP decompõe a saída do RF em um valor-base e contribuições das entradas. O valor-base ficou próximo de 0,5 porque o treino foi balanceado. Em 200 casos originais do teste, conferi que valor-base mais contribuições reconstruiu predict_proba com erro numérico desprezível. Isso verifica que a explicação é fiel à saída do modelo.

## Lâmina 7 — Importância global (00:50)

Na visão global, somei as contribuições das categorias de cada variável por registro e calculei a média dos valores absolutos. Idade aparece primeiro, seguida de glicose e tipo de trabalho. O gráfico mede quanto cada variável alterou a saída deste RF neste CSV; ele não mostra efeito causal ou risco clínico.

## Lâmina 8 — Direção global (00:45)

Cada ponto representa uma pessoa. À direita, a entrada aumenta a saída para AVC; à esquerda, reduz. A cor mostra o valor. Na linha da idade, valores altos ficaram predominantemente do lado positivo. Portanto, este RF aprendeu a elevar a previsão quando a idade é maior.

## Lâmina 9 — Caso correto (00:50)

Este caso tem rótulo 1 e o RF retornou 0,98. O waterfall parte do valor-base e soma contribuições como idade e outras entradas, até chegar à saída. O valor 0,98 não é uma probabilidade clínica calibrada de AVC futuro.

## Lâmina 10 — Caso incorreto (00:55)

Este caso mostra o ponto mais importante da extensão: o rótulo era 1, mas o RF previu 0, com saída 0,03. O SHAP revela quais entradas puxaram a saída para baixo. A explicação continua fiel à previsão, embora a decisão esteja errada. Isso permite investigar a falha do modelo.

## Lâmina 11 — Conclusão (00:45)

O projeto aplicou SHAP globalmente e em casos individuais, verificando matematicamente as contribuições. O RF teve baixa capacidade de detectar positivos, e o CSV tem limitações; não há base para uso clínico. O objetivo de explicabilidade foi atendido: podemos examinar como o RF chegou a cada saída, inclusive nos erros.

## Resposta curta para perguntas

- O artigo, a seleção da coorte e a procedência do CSV estão detalhados no [README técnico](../README.md) e nas referências da apresentação.
- O SHAP verifica a decomposição da **saída do RF**, inclusive no falso negativo. Essa igualdade não mede acerto preditivo nem estabelece causa clínica.
- O [site](../site/index.html) permite explorar mais dez registros do teste.
