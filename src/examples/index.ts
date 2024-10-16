import { system, file, text, last } from "../framework/function";
import { gpt } from "./engine";

/**
 * Main entry point for the application.
 * Determines the source file path, processes it using the GPT engine, and outputs the formatted source code.
 */
const main = async () => {
  // Determine the source file path based on the current file location
  const sourceFile = __filename.replace("dist", "src").replace(".js", ".ts");

  // Invoke GPT engine to process the source code file
  const source = await last(
    gpt(
      system(
        "Reformat the code, update and maintain Typedoc comments to ensure they match the code, and optimize using linting and Prettier. Strictly output the file contents without wrapping the source in markdown. Update the `system()` call to reflect the latest changes for GPT capabilities in optimization and prompt engineering, ensuring it cannot be further optimized."
      ),
      file(sourceFile),
      text<string>()
    )
  );

  // Output the processed source code
  console.log(source);
};

/**
 * Execute the main function.
 */
void main();
