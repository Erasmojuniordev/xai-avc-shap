import java.io.File;
import java.io.PrintWriter;
import java.util.Locale;
import java.util.Random;

import weka.classifiers.Evaluation;
import weka.classifiers.functions.MultilayerPerceptron;
import weka.core.Instances;
import weka.core.converters.ConverterUtils.DataSource;
import weka.filters.Filter;
import weka.filters.unsupervised.attribute.ReplaceMissingValues;
import weka.filters.supervised.instance.SMOTE;

/** Reprodução aproximada do protocolo publicado, com diferenças registradas no README. */
public final class ExperimentoWeka {
    private static final int SEED = 42;
    private static final int FOLDS = 10;

    private static MultilayerPerceptron mlp() {
        MultilayerPerceptron model = new MultilayerPerceptron();
        // Estes quatro hiperparâmetros constam explicitamente no artigo.
        model.setHiddenLayers("a");
        model.setLearningRate(0.3);
        model.setMomentum(0.2);
        model.setTrainingTime(500);
        model.setSeed(SEED); // Semente não publicada; fixada para reprodução.
        return model;
    }

    private static void report(String name, Instances data, Evaluation eval, PrintWriter out) throws Exception {
        int positive = data.classAttribute().indexOfValue("1");
        double[][] cm = eval.confusionMatrix();
        double accuracy = eval.pctCorrect() / 100.0;
        double precision = eval.precision(positive);
        double recall = eval.recall(positive);
        double f1 = eval.fMeasure(positive);
        double auc = eval.areaUnderROC(positive);
        System.out.printf(Locale.ROOT,
            "%s: n=%d, acuracia=%.4f, precisao_1=%.4f, recall_1=%.4f, f1_1=%.4f, auc_1=%.4f, TN=%.0f, FP=%.0f, FN=%.0f, TP=%.0f%n",
            name, data.numInstances(), accuracy, precision, recall, f1, auc,
            cm[0][0], cm[0][1], cm[1][0], cm[1][1]);
        out.printf(Locale.ROOT,
            "  \"%s\": {\"n\": %d, \"accuracy\": %.8f, \"precision_stroke_1\": %.8f, \"recall_stroke_1\": %.8f, \"f1_stroke_1\": %.8f, \"auc_stroke_1\": %.8f, \"tn\": %.0f, \"fp\": %.0f, \"fn\": %.0f, \"tp\": %.0f}",
            name, data.numInstances(), accuracy, precision, recall, f1, auc,
            cm[0][0], cm[0][1], cm[1][0], cm[1][1]);
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 2) {
            throw new IllegalArgumentException("Uso: ExperimentoWeka <adultos.arff> <metricas.json>");
        }
        Instances adults = DataSource.read(args[0]);
        adults.setClassIndex(adults.numAttributes() - 1);
        if (adults.numAttributes() != 11 || adults.classAttribute().indexOfValue("1") != 1) {
            throw new IllegalStateException("Esperadas 10 entradas e classe nominal {0,1} no final.");
        }
        int missingBmi = 0;
        for (int i = 0; i < adults.numInstances(); i++) {
            if (adults.instance(i).isMissing(adults.attribute("bmi"))) missingBmi++;
        }

        // O artigo afirma ausência de faltantes. Aqui a mediana/moda é calculada na
        // coorte inteira para aproximar o protocolo pré-CV; isso também vaza dados.
        ReplaceMissingValues imputer = new ReplaceMissingValues();
        imputer.setInputFormat(adults);
        Instances filled = Filter.useFilter(adults, imputer);
        filled.setClassIndex(filled.numAttributes() - 1);

        // O paper descreve SMOTE antes da CV. 1498% adiciona 3.700 exemplos à
        // minoria (247 originais), aproximando 3.947 exemplos em cada classe.
        SMOTE smote = new SMOTE();
        smote.setClassValue("2"); // Índice WEKA 1-based: segundo valor nominal = stroke 1.
        smote.setPercentage(1498.0);
        smote.setNearestNeighbors(5); // Padrão WEKA; o artigo não especifica K.
        smote.setRandomSeed(SEED);
        smote.setInputFormat(filled);
        Instances balanced = Filter.useFilter(filled, smote);
        balanced.setClassIndex(balanced.numAttributes() - 1);

        System.out.printf("Adultos=%d, positivos=%d, BMI ausente=%d, balanceados=%d%n",
            adults.numInstances(), adults.attributeStats(adults.classIndex()).nominalCounts[1],
            missingBmi, balanced.numInstances());

        // CV reproduz a ordem indicada no texto, mas inclui sintéticos na validação.
        Evaluation articleLike = new Evaluation(balanced);
        articleLike.crossValidateModel(mlp(), balanced, FOLDS, new Random(SEED));

        // Referência sem SMOTE: ainda usa a imputação global, portanto não é uma
        // avaliação inteiramente livre de vazamento. Está aqui só como contraste.
        Evaluation unbalanced = new Evaluation(filled);
        unbalanced.crossValidateModel(mlp(), filled, FOLDS, new Random(SEED));

        File output = new File(args[1]);
        output.getParentFile().mkdirs();
        try (PrintWriter out = new PrintWriter(output, "UTF-8")) {
            out.println("{");
            out.printf("  \"adultos\": %d, \"positivos_originais\": %d, \"bmi_ausentes\": %d, \"balanceados\": %d, \"seed\": %d, \"dobras\": %d,%n",
                adults.numInstances(), adults.attributeStats(adults.classIndex()).nominalCounts[1],
                missingBmi, balanced.numInstances(), SEED, FOLDS);
            report("mlp_smote_antes_cv", balanced, articleLike, out);
            out.println(",");
            report("mlp_sem_smote", filled, unbalanced, out);
            out.println();
            out.println("}");
        }
    }
}
