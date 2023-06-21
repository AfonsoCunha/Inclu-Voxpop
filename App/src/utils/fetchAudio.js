export async function fetchAudio(locationId, itemType, itemId) {
  console.log("fetchAudio");
  return new Promise(async (resolve, reject) => {
    try {
      let responseAudio = await fetch(`/data/${locationId}/audio/${itemType}/${itemId}.mp3`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      resolve(responseAudio.url);
    } catch (error) {
      console.log(error)
      reject("Failed to load audio.");
    }
  });
}
