/** kie.ai model identifiers used by the product video pipeline — see docs.kie.ai/market/*. */
export const KIE_MODELS = {
  /** Multi-image editing (up to 10 input images) — used to put a model in the product outfit. */
  imageEdit: "google/nano-banana-edit",
  /** Image-to-video, 5s or 10s clips — used to animate the model image into short clips. */
  imageToVideo: "kling-2.6/image-to-video",
  /** Multi-speaker text-to-dialogue voiceover. */
  textToSpeech: "elevenlabs/text-to-dialogue-v3",
} as const;
