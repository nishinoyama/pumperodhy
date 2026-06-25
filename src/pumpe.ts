export class PumpState {
  pump: string;
  permutation: boolean;
  generatePump: () => string;
  permutationWeights: number[];

  constructor(pump: string, permutation: boolean) {
    this.pump = pump;
    this.permutation = permutation;
    this.generatePump = permutation ? this.generatePermutationPump : this.generateCombinationPump;

    // To determine the length of the permutation
    const pumpRes = splitGraphemes(this.pump);
    const logWeights = [Number.NEGATIVE_INFINITY];
    let logWeight = 0;
    for (let length = 1; length <= pumpRes.length; length++) {
      logWeight += Math.log(pumpRes.length - length + 1);
      logWeights.push(logWeight);
    }

    const maxLogWeight = logWeights[logWeights.length - 1];
    const weights = [0];
    for (let length = 1; length < logWeights.length; length++) {
      weights.push(weights[length - 1] + Math.exp(logWeights[length] - maxLogWeight));
    }
    this.permutationWeights = weights;
  }

  generateCombinationPump(): string {
    const pumpRes = splitGraphemes(this.pump);
    if (pumpRes.length < 2) {
      return this.pump;
    }
    const res = pumpRes.filter((_) => Math.random() < 0.5).join("");
    if (res === "" || res === this.pump) {
      return this.generateCombinationPump();
    }
    return res;
  }

  generatePermutationPump(): string {
    const pumpRes = splitGraphemes(this.pump);
    if (pumpRes.length < 2) {
      return this.pump;
    }
    const length = this.getPermutationRandomLength();
    const levels = Array.from({length: pumpRes.length}, _ => Math.random());
    const order = levels.map((_, i) => i).sort((a, b) => levels[a] - levels[b]);
    const res = order.map((i) => pumpRes[i]).slice(0, length).join("");
    if (res === this.pump) {
      return this.generatePermutationPump();
    }
    return res;
  }

  getPermutationRandomLength(): number {
    const random = Math.random() * this.permutationWeights[this.permutationWeights.length - 1];
    for (let length = 1; length < this.permutationWeights.length; length++) {
      if (random < this.permutationWeights[length]) {
        return length;
      }
    }
    return this.permutationWeights.length - 1;
  }

  changeMode(): void {
    this.permutation = !this.permutation;
    this.generatePump = this.permutation ? this.generatePermutationPump : this.generateCombinationPump;
  }
}

const graphemeSegmenter = new Intl.Segmenter(undefined, {granularity: "grapheme"});

function splitGraphemes(value: string): string[] {
  return Array.from(graphemeSegmenter.segment(value), ({segment}) => segment);
}

export class ResultsState {
  results: string[];
  resultsDiv: HTMLDivElement;

  constructor(resultsDiv: HTMLDivElement) {
    this.results = [];
    this.resultsDiv = resultsDiv;
  }

  renderResults(): void {
    this.resultsDiv.innerHTML = `<ul>${this.results.map((res) => `<li>${evalPump(res)}</li>`).join("")}</ul>`;
  }

  setResults(result: string[]): void {
    this.results = result;
  }
}

export function setupPump(element: HTMLButtonElement, pumpState: PumpState, results: ResultsState, times: number = 1) {
  element.addEventListener('click', () => {
    const pump = Array.from({length: times}, () => pumpState.generatePump());
    results.setResults(pump);
    results.renderResults();
  });
}

export function setupPermutation(element: HTMLButtonElement, pumpState: PumpState) {
  element.addEventListener('click', () => {
    pumpState.changeMode();
    element.innerHTML = pumpState.permutation ? "Enabled" : "Disabled";
  });
}

function evalPump(pump: string): string {
  const escapedPump = escapeHtml(pump);
  if (pump === "プンポロドイハ") {
    return `<span class='pump-tier1'>${escapedPump}</span>`;
  }
  if (["ドロポン", "ハイドロ", "ハイポン"].includes(pump)) {
    return `<span class='pump-tier2'>${escapedPump}</span>`;
  }
  if (["ポンプ", "イドンプ", "ドロンプ", "ハインプ", "ハドロン"].includes(pump)) {
    return `<span class='pump-tier3'>${escapedPump}</span>`;
  }
  return escapedPump;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}
