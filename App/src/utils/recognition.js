import * as tf from "@tensorflow/tfjs";

export const model = {
  model: undefined,
  locationId: undefined,
  views: undefined,
  items: undefined,
  zones: undefined,
};

export async function getRecognitionData(locationId) {
  return new Promise(async (resolve, reject) => {
    try {
      let responseRecognitionTargets = await fetch(
        "/data/" + locationId + "/recognition_targets.json",
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      const recognitionTargets = await responseRecognitionTargets.json();

      let responseViews = await fetch("/data/" + locationId + "/views.json", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const views = await responseViews.json();

      let responseItems = await fetch("/data/" + locationId + "/items.json", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const items = await responseItems.json();

      let responseZones = await fetch("/data/" + locationId + "/zones.json", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const zones = await responseZones.json();

      resolve([recognitionTargets, views, items, zones]);
    } catch (error) {
      reject("O carregamento dos dados para reconhecimento falhou. Recarregue a app para tentar novamente.");
    }
  });
}

export async function loadRecognitionModel(locationId) {
  return new Promise(async (resolve, reject) => {
    try {
      const model = await tf.loadGraphModel(
        window.location.protocol +
          "//" +
          window.location.host +
          "/data/" +
          locationId +
          "/model/model.json",
        {
          requestInit: { cache: "default" },
        }
      );
      resolve(model);
    } catch (error) {
      reject("O carregamento do modelo de reconhecimento falhou. Recarregue a app para tentar novamente.");
    }
  });
}

export async function initializeModel(model) {
  // Perform one prediction to initialize system
  return new Promise(async (resolve, reject) => {
    try {
      model.predict(tf.zeros([1, 224, 224, 3])).dispose();
      resolve();
    } catch (error) {
      console.log(error)
      reject("A inicialização do modelo de reconhecimento falhou. Recarregue a app para tentar novamente.");
    }
  });
}
