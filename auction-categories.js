export const auctionCategories = [
  { id: 'ex', name: 'EX', subtitle: 'Mais poder para a sua coleção', symbol: '✦' },
  { id: 'silver', name: 'Borda cinza', subtitle: 'Um novo brilho entre os seus favoritos', symbol: '◇' },
  { id: 'yellow', name: 'Borda amarela', subtitle: 'Clássicos que trazem boas memórias', symbol: '◈' },
  { id: 'rare-art', name: 'Artes raras', subtitle: 'Ilustrações que merecem um lugar especial', symbol: '✧' },
  { id: 'other', name: 'Outros achados', subtitle: 'Mais cartas para descobrir', symbol: '✶' },
];
export function auctionCategory(item) {
  if (auctionCategories.some(category => category.id === item.category)) return item.category;
  // Compatibilidade com lotes anteriores à classificação por seção.
  if (/\bex\b/i.test(item.name)) return 'ex';
  return 'other';
}
