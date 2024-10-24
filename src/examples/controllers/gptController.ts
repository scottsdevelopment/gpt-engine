import { Describe } from "../../decorators/describe";
import { Parameter } from "../../decorators/parameter";
import { Required } from "../../decorators/required";
import { image, system, tts } from "../../framework/function";

export default class GptController {
  /**
   * This method is used to simulate a thinking process without performing any action.
   *
   * @returns {string} A message indicating that thought was required but no action was taken.
   */
  @Describe("Required to think and do nothing.")
  think() {
    return system("Thought required, but no action taken.");
  }

  /**
   * Generates an image based on a provided prompt. This method also supports generating
   * a text-to-speech response related to the image calls.
   *
   * @param {string} prompt - The prompt for the image generation.
   * @returns A generated image based on the prompt.
   */
  @Describe(
    "Create or draw an image based on a prompt, you also like to return a textToSpeech with your image calls."
  )
  async image(
    @Parameter("The prompt of the image to generate") @Required prompt: string
  ) {
    return image(prompt);
  }

  /**
   * Responds to a given prompt by generating a text-to-speech output. This method is used
   * to answer any system or user prompts, even if the response is apologetic, unhelpful, or
   * indicates inability to complete a task.
   *
   * @param {string} response - The model's text completion based on the current prompt and directions.
   * @returns A text-to-speech output of the generated response.
   */
  @Describe(
    "Respond and generate text to speech sound, always use this to answer any prompts from a system or user even when apologizing, unhelpful, wrong or unable to complete a task."
  )
  async textToSpeech(
    @Parameter(
      "Generate a response input based off the messages, the input should be the models text completion based off the current prompt and directions."
    )
    @Required
    response: string
  ) {
    return tts(response);
  }
}
