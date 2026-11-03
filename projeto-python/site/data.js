window.XAI_DATA = {
  "descricao": "Dez registros originais do teste do RF; saída para stroke=1, não risco clínico.",
  "valor_base": 0.49979490022172945,
  "erro_maximo_aditividade": 2.275957200481571e-15,
  "variaveis": [
    {
      "nome": "age",
      "rotulo": "Idade (anos)",
      "importancia_global": 0.17644416133070365
    },
    {
      "nome": "avg_glucose_level",
      "rotulo": "Glicose média (mg/dL)",
      "importancia_global": 0.08157728468515643
    },
    {
      "nome": "bmi",
      "rotulo": "IMC",
      "importancia_global": 0.04312775218085454
    },
    {
      "nome": "gender",
      "rotulo": "Gênero",
      "importancia_global": 0.020333549977901724
    },
    {
      "nome": "hypertension",
      "rotulo": "Hipertensão",
      "importancia_global": 0.015502052446501094
    },
    {
      "nome": "heart_disease",
      "rotulo": "Doença cardíaca",
      "importancia_global": 0.005171844258323397
    },
    {
      "nome": "ever_married",
      "rotulo": "Já casou",
      "importancia_global": 0.04162288856404448
    },
    {
      "nome": "work_type",
      "rotulo": "Trabalho",
      "importancia_global": 0.07605319202754879
    },
    {
      "nome": "Residence_type",
      "rotulo": "Residência",
      "importancia_global": 0.02695550219630403
    },
    {
      "nome": "smoking_status",
      "rotulo": "Tabagismo",
      "importancia_global": 0.04379319630000206
    }
  ],
  "casos": [
    {
      "id": 40899,
      "tipo": "Verdadeiro positivo",
      "real": 1,
      "previsto": 1,
      "saida_modelo": 0.98,
      "entradas": {
        "age": 78.0,
        "avg_glucose_level": 60.67,
        "bmi": null,
        "gender": "Female",
        "hypertension": "0",
        "heart_disease": "0",
        "ever_married": "Yes",
        "work_type": "Self-employed",
        "Residence_type": "Rural",
        "smoking_status": "formerly smoked"
      },
      "shap": {
        "age": 0.18875554282758888,
        "avg_glucose_level": 0.003211011504297121,
        "bmi": 0.046186016101348176,
        "gender": 0.013179419346012165,
        "hypertension": -0.01651048240169951,
        "heart_disease": 0.013183759621286586,
        "ever_married": 0.035963600891546765,
        "work_type": 0.0035585308839060433,
        "Residence_type": 0.06539161423988354,
        "smoking_status": 0.12728608676410266
      }
    },
    {
      "id": 8580,
      "tipo": "Verdadeiro positivo",
      "real": 1,
      "previsto": 1,
      "saida_modelo": 0.76,
      "entradas": {
        "age": 77.0,
        "avg_glucose_level": 90.0,
        "bmi": 32.0,
        "gender": "Female",
        "hypertension": "0",
        "heart_disease": "0",
        "ever_married": "Yes",
        "work_type": "Self-employed",
        "Residence_type": "Rural",
        "smoking_status": "never smoked"
      },
      "shap": {
        "age": 0.20398310950398169,
        "avg_glucose_level": 0.002247108550934363,
        "bmi": 0.008437417877398082,
        "gender": 0.022718025710231123,
        "hypertension": -0.009288711556217523,
        "heart_disease": 0.01460144561966994,
        "ever_married": 0.03364177043801792,
        "work_type": -0.04754847064302718,
        "Residence_type": -0.03624821463543942,
        "smoking_status": 0.0676616189127229
      }
    },
    {
      "id": 32221,
      "tipo": "Verdadeiro positivo",
      "real": 1,
      "previsto": 1,
      "saida_modelo": 0.605,
      "entradas": {
        "age": 60.0,
        "avg_glucose_level": 91.92,
        "bmi": 35.9,
        "gender": "Male",
        "hypertension": "0",
        "heart_disease": "1",
        "ever_married": "Yes",
        "work_type": "Private",
        "Residence_type": "Urban",
        "smoking_status": "smokes"
      },
      "shap": {
        "age": 0.08330478570088373,
        "avg_glucose_level": -0.18286049189646875,
        "bmi": -0.031653217526146554,
        "gender": 0.045600799550742796,
        "hypertension": 0.006374494049303566,
        "heart_disease": 0.024004750731213956,
        "ever_married": 0.02796731616948111,
        "work_type": 0.06124438417277897,
        "Residence_type": 0.0013810863789394598,
        "smoking_status": 0.0698411924475416
      }
    },
    {
      "id": 63973,
      "tipo": "Falso negativo",
      "real": 1,
      "previsto": 0,
      "saida_modelo": 0.5,
      "entradas": {
        "age": 77.0,
        "avg_glucose_level": 190.32,
        "bmi": 31.4,
        "gender": "Female",
        "hypertension": "0",
        "heart_disease": "0",
        "ever_married": "Yes",
        "work_type": "Govt_job",
        "Residence_type": "Rural",
        "smoking_status": "never smoked"
      },
      "shap": {
        "age": 0.06055823075773842,
        "avg_glucose_level": 0.08430159936876101,
        "bmi": 0.025616320420117095,
        "gender": 0.04586861169462612,
        "hypertension": -0.0007621025610992831,
        "heart_disease": -0.0009174745777436294,
        "ever_married": 0.024757271365839904,
        "work_type": -0.30358405230721974,
        "Residence_type": 0.02438869694530601,
        "smoking_status": 0.039977998671942704
      }
    },
    {
      "id": 31112,
      "tipo": "Falso negativo",
      "real": 1,
      "previsto": 0,
      "saida_modelo": 0.19,
      "entradas": {
        "age": 80.0,
        "avg_glucose_level": 105.92,
        "bmi": 32.5,
        "gender": "Male",
        "hypertension": "0",
        "heart_disease": "1",
        "ever_married": "Yes",
        "work_type": "Private",
        "Residence_type": "Rural",
        "smoking_status": "never smoked"
      },
      "shap": {
        "age": 0.1087368461395408,
        "avg_glucose_level": -0.19071623521579015,
        "bmi": -0.021518976831056125,
        "gender": -0.0006490126679144019,
        "hypertension": -0.00800760376655424,
        "heart_disease": -0.14824657142177547,
        "ever_married": 0.018232737107962103,
        "work_type": 0.03761191339278117,
        "Residence_type": -0.02786536009514001,
        "smoking_status": -0.0773726368637854
      }
    },
    {
      "id": 54385,
      "tipo": "Falso negativo",
      "real": 1,
      "previsto": 0,
      "saida_modelo": 0.03,
      "entradas": {
        "age": 45.0,
        "avg_glucose_level": 64.14,
        "bmi": 29.4,
        "gender": "Male",
        "hypertension": "0",
        "heart_disease": "0",
        "ever_married": "Yes",
        "work_type": "Private",
        "Residence_type": "Rural",
        "smoking_status": "never smoked"
      },
      "shap": {
        "age": -0.23875988860144057,
        "avg_glucose_level": -0.10332282546139211,
        "bmi": 0.019006146199311038,
        "gender": -0.126447709699484,
        "hypertension": -0.0103725641415769,
        "heart_disease": 0.0016437010306821023,
        "ever_married": 0.023958682700627336,
        "work_type": 0.023108815226361264,
        "Residence_type": -0.0615095021012295,
        "smoking_status": 0.0029002446264104627
      }
    },
    {
      "id": 56469,
      "tipo": "Falso positivo",
      "real": 0,
      "previsto": 1,
      "saida_modelo": 0.97,
      "entradas": {
        "age": 67.0,
        "avg_glucose_level": 238.78,
        "bmi": 35.7,
        "gender": "Male",
        "hypertension": "0",
        "heart_disease": "0",
        "ever_married": "Yes",
        "work_type": "Private",
        "Residence_type": "Urban",
        "smoking_status": "formerly smoked"
      },
      "shap": {
        "age": 0.08495513367410515,
        "avg_glucose_level": 0.08659439033156861,
        "bmi": -0.00722660825498888,
        "gender": 0.07369159719241908,
        "hypertension": 0.015082874556168208,
        "heart_disease": -0.005471161260522682,
        "ever_married": 0.0352373075657888,
        "work_type": 0.11459413573594449,
        "Residence_type": 0.015804932229102883,
        "smoking_status": 0.05694249800868541
      }
    },
    {
      "id": 34026,
      "tipo": "Falso positivo",
      "real": 0,
      "previsto": 1,
      "saida_modelo": 0.505,
      "entradas": {
        "age": 60.0,
        "avg_glucose_level": 207.84,
        "bmi": 38.9,
        "gender": "Female",
        "hypertension": "0",
        "heart_disease": "0",
        "ever_married": "Yes",
        "work_type": "Private",
        "Residence_type": "Rural",
        "smoking_status": "never smoked"
      },
      "shap": {
        "age": -0.008524721325653897,
        "avg_glucose_level": 0.061804758554461985,
        "bmi": -0.030913367243728857,
        "gender": -0.05341568907476128,
        "hypertension": 0.020684871647114085,
        "heart_disease": 0.003577931149209454,
        "ever_married": 0.02842042586762747,
        "work_type": 0.039544259073556326,
        "Residence_type": -0.06098611046187847,
        "smoking_status": 0.005012741592322919
      }
    },
    {
      "id": 7892,
      "tipo": "Verdadeiro negativo",
      "real": 0,
      "previsto": 0,
      "saida_modelo": 0.5,
      "entradas": {
        "age": 78.0,
        "avg_glucose_level": 74.7,
        "bmi": 28.8,
        "gender": "Male",
        "hypertension": "0",
        "heart_disease": "0",
        "ever_married": "Yes",
        "work_type": "Private",
        "Residence_type": "Urban",
        "smoking_status": "formerly smoked"
      },
      "shap": {
        "age": 0.09289143941726599,
        "avg_glucose_level": -0.18048137275962695,
        "bmi": 0.05792564230410947,
        "gender": 0.008872101924424813,
        "hypertension": 0.0018796380067526235,
        "heart_disease": 0.010804490820517263,
        "ever_married": 0.029911389576825143,
        "work_type": 0.06320291589553224,
        "Residence_type": -0.013113220492365664,
        "smoking_status": -0.0716879249151642
      }
    },
    {
      "id": 23633,
      "tipo": "Verdadeiro negativo",
      "real": 0,
      "previsto": 0,
      "saida_modelo": 0.0,
      "entradas": {
        "age": 37.0,
        "avg_glucose_level": 83.65,
        "bmi": 42.1,
        "gender": "Female",
        "hypertension": "0",
        "heart_disease": "0",
        "ever_married": "Yes",
        "work_type": "Private",
        "Residence_type": "Rural",
        "smoking_status": "smokes"
      },
      "shap": {
        "age": -0.27246836639824373,
        "avg_glucose_level": -0.08725417281099658,
        "bmi": -0.07476445078576092,
        "gender": -0.022520307885223165,
        "hypertension": -0.009645379151481552,
        "heart_disease": 2.5086389215714227e-05,
        "ever_married": 0.013832631637813836,
        "work_type": 0.016186859000667443,
        "Residence_type": -0.023843762033485143,
        "smoking_status": -0.03934303818423481
      }
    }
  ]
};
