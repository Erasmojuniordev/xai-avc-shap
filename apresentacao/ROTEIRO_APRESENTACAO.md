# Roteiro da apresentação crítica

Arquivo para projetar: [Apresentacao_Critica_AVC_SHAP.pptx](Apresentacao_Critica_AVC_SHAP.pptx). A versão original `Apresentao_-_Erasmo.pdf` continua como registro da proposta inicial. A nova apresentação tem 12 slides e notas do apresentador incorporadas.

## Fala sugerida

1. **Capa.** Apresentar a extensão com SHAP e antecipar que a auditoria dos dados mudou a interpretação possível dos resultados.
2. **Pergunta.** O artigo de Dritsas e Trigka relatou RF com 97% de acurácia e AUC de 0,986. A extensão busca explicar previsões com SHAP. A descrição do RF não informa todos os parâmetros necessários para réplica exata.
3. **Auditoria.** O filtro `age > 18` produziu 4.194 registros no CSV, contra 3.254 no artigo. Há 180 IMCs ausentes entre adultos. Não inventamos um filtro para forçar o número publicado.
4. **Método.** A divisão estratificada vem antes de imputação e SMOTENC. O treino foi balanceado, enquanto o teste preservou 839 registros originais do CSV e 49 rótulos positivos.
5. **Teste principal.** Acurácia de 87,37% significa 733 acertos em 839 registros. O RF identificou 9 dos 49 positivos e deixou passar 40. Um classificador que sempre prevê `0` teria 94,16% de acurácia nesse teste; por isso, recall, precisão e F1 são indispensáveis.
6. **Experimento secundário.** SMOTENC dentro de cada dobra resultou em AUC média de 0,738. Aplicá-lo antes das dobras elevou a AUC para 0,981, mas a validação passou a incluir 3.700 positivos sintéticos e risco de vazamento. Entre os 3.752 acertos positivos desse protocolo, apenas 139 eram registros originais do CSV.
7. **SHAP global.** A idade dominou as contribuições médias do RF. Trabalho também teve destaque, mas importância do modelo não equivale a causalidade. Hipertensão e doença cardíaca tiveram impacto menor neste RF.
8. **SHAP local.** Mostrar o waterfall do registro 40899. As barras de contribuição e o valor-base recompõem a saída 0,98 do RF. Essa saída não foi calibrada para prevalência real e não é risco clínico futuro.
9. **Interpretação clínica.** No CSV, os rótulos positivos são mais frequentes entre participantes com hipertensão e doença cardíaca. A idade pode compartilhar informação com essas variáveis. Não atribuir a baixa importância SHAP a uma causa única nem contrariar a literatura clínica.
10. **Procedência.** Gibson et al. (2026) encontraram 0 de 9 itens de procedência documentados e distribuições anômalas neste dataset. A autenticidade não foi verificada. Os autores não provaram que todos os registros são fabricados. Como a análise é posterior ao artigo base de 2022, evitar atribuir intenção aos autores originais.
11. **Conclusão.** A implementação é reproduzível e o SHAP decompõe a saída do modelo; o desempenho positivo no teste foi baixo. A procedência incerta impede interpretar os números como evidência clínica. O valor da entrega está na implementação e na análise crítica dos limites.
12. **Referências.** Apontar artigo base, crítica de procedência, CDC, artigo original do SHAP e o repositório com código e resultados.

## Respostas curtas a perguntas prováveis

**O SMOTE foi usado?** Sim. Aplicamos SMOTENC, variante para dados numéricos e categóricos, somente no treino principal. O segundo protocolo que o aplica antes das dobras existe apenas para demonstrar o efeito metodológico.

**Por que 87% não é bom?** Porque o RF detectou somente 9 de 49 rótulos positivos no teste. A classe negativa é majoritária, então a acurácia isolada recompensa previsões negativas.

**O SHAP confirma fatores de risco?** Não. Ele distribui a contribuição das variáveis para a saída de um modelo treinado neste arquivo. A literatura clínica é usada para confronto de plausibilidade, sem validar o dataset ou estabelecer causalidade.

**Por que não trocar o RF por J48?** O artigo descreve mais configurações de J48, mas isso não resolveria a procedência do dataset. Uma comparação fiel exigiria o próprio WEKA e seria um experimento adicional. O escopo desta entrega é RF com `TreeExplainer`.

**O dataset é comprovadamente falso?** Não. O estudo de 2026 não conseguiu verificar sua autenticidade e encontrou anomalias; isso basta para impedir conclusões clínicas, sem afirmar fabricação de todos os registros.

## Fontes principais

- Dritsas, E.; Trigka, M. (2022). [*Stroke Risk Prediction with Machine Learning Techniques*](https://doi.org/10.3390/s22134670).
- Gibson, A. D. et al. (2026). [*Evidence of unreliable data and poor data provenance in clinical prediction model research and clinical practice*](https://doi.org/10.1186/s12916-026-04981-y).
- CDC. [*Risk Factors for Stroke*](https://www.cdc.gov/stroke/risk-factors/).
- Lundberg, S. M.; Lee, S.-I. (2017). [*A Unified Approach to Interpreting Model Predictions*](https://arxiv.org/abs/1705.07874).
