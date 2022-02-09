// Sort by blockNumber, and if tied, sort by transactionIndex
export function sortEvents(events) {
  return events.sort((a, b) =>
    parseInt(a.blockNumber) > parseInt(b.blockNumber)
      ? 1
      : parseInt(a.blockNumber) === parseInt(b.blockNumber)
      ? parseInt(a.transactionIndex) > parseInt(b.transactionIndex)
        ? 1
        : -1
      : -1,
  );
}
