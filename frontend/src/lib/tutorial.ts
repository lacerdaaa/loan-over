const KEY = 'loanover_tutorial_done';

export const hasDoneTutorial = (): boolean =>
  localStorage.getItem(KEY) === 'true';

export const markTutorialDone = (): void =>
  localStorage.setItem(KEY, 'true');
