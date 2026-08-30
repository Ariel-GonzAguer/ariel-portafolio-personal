/**
 * Estimación de CO2 generado por una llamada a la API de OpenAI.
 *
 * Basado en:
 * - Un token ≈ 0.000000075 kg CO2 para modelos cloud (estimación conservadora).
 * - Referencia: https://www.technologyreview.com/2023/12/05/1084365/ai-carbon-emissions/
 *
 * La fórmula es simplificada: no cuenta infraestructura, cooling, etc.
 * Sirve como indicador relativo, no absoluto.
 */

const CO2_PER_TOKEN_KG = 0.000000075;

/**
 * Estima tokens a partir de caracteres (aprox: 1 token ≈ 4 chars en inglés/code).
 */
export function estimateTokens(charCount: number): number {
  return Math.ceil(charCount / 4);
}

/**
 * Calcula CO2 estimado en gramos para una cantidad de tokens.
 */
export function estimateCO2Grams(totalTokens: number): number {
  return totalTokens * CO2_PER_TOKEN_KG * 1000;
}

/**
 * Formatea CO2 para mostrar al usuario.
 * - < 1g: "0.XX g"
 * - >= 1g: "X.X g"
 */
export function formatCO2(grams: number): string {
  if (grams < 1) {
    return `${grams.toFixed(2)} g`;
  }
  return `${grams.toFixed(1)} g`;
}

/**
 * Calcula CO2 total de un review: input + output.
 */
export function calculateReviewCO2(inputChars: number, outputChars: number): string {
  const inputTokens = estimateTokens(inputChars);
  const outputTokens = estimateTokens(outputChars);
  const totalTokens = inputTokens + outputTokens;
  const grams = estimateCO2Grams(totalTokens);
  return formatCO2(grams);
}
