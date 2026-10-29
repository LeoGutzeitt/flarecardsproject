export const ticketTemplates=[{id:'brasa',name:'Brasa',description:'Vermelho e preto · a chama da Flare'},{id:'ouro',name:'Ouro',description:'Preto e dourado · uma conquista especial'}];
export function validateTicketTemplate(id='brasa'){if(!ticketTemplates.some(t=>t.id===id))throw Error('Escolha um modelo de ticket válido.');return id;}
