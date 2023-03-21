export function getFriendlyErrorMessage(e: any) {
  console.error(e);

  if (typeof e === 'string')
    return e;

  if (e instanceof Error)
    return (e as Error).message;

  return 'Unknown error occurred';
}
