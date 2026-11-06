import type { ItemDoCardapio, Mesa, Usuario } from "@/domain/tipos";

export const USUARIOS: Array<Usuario & { senha: string }> = [
  { id: "u-1", nome: "Ana (garcom)", papel: "garcom", senha: "123456" },
  { id: "u-2", nome: "Beto (cozinha)", papel: "cozinha", senha: "123456" },
  { id: "u-3", nome: "Carla (bar)", papel: "bar", senha: "123456" },
  { id: "u-4", nome: "Davi (caixa)", papel: "caixa", senha: "123456" },
];

export const MESAS: Mesa[] = Array.from({ length: 12 }, (_, indice) => ({
  id: `mesa-${indice + 1}`,
  numero: indice + 1,
  capacidade: indice < 8 ? 4 : 6,
}));

export const CARDAPIO: ItemDoCardapio[] = [
  { id: "c-1", nome: "Chopp Pilsen 500ml", categoria: "Bebidas", precoEmCentavos: 1890, destino: "bar", disponivel: true },
  { id: "c-2", nome: "Chopp IPA 500ml", categoria: "Bebidas", precoEmCentavos: 2290, destino: "bar", disponivel: true },
  { id: "c-3", nome: "Caipirinha de limao", categoria: "Bebidas", precoEmCentavos: 2490, destino: "bar", disponivel: true },
  { id: "c-4", nome: "Refrigerante lata", categoria: "Bebidas", precoEmCentavos: 790, destino: "bar", disponivel: true },
  { id: "c-5", nome: "Agua sem gas 500ml", categoria: "Bebidas", precoEmCentavos: 590, destino: "bar", disponivel: true },
  { id: "c-6", nome: "Suco de laranja 400ml", categoria: "Bebidas", precoEmCentavos: 1290, destino: "bar", disponivel: false },
  { id: "c-7", nome: "Porcao de mandioca frita", categoria: "Entradas", precoEmCentavos: 3250, destino: "cozinha", disponivel: true },
  { id: "c-8", nome: "Bolinho de bacalhau (6un)", categoria: "Entradas", precoEmCentavos: 4490, destino: "cozinha", disponivel: true },
  { id: "c-9", nome: "Pastel de carne (4un)", categoria: "Entradas", precoEmCentavos: 2890, destino: "cozinha", disponivel: true },
  { id: "c-10", nome: "Picanha na chapa (500g)", categoria: "Principais", precoEmCentavos: 12900, destino: "cozinha", disponivel: true },
  { id: "c-11", nome: "File de frango grelhado", categoria: "Principais", precoEmCentavos: 6490, destino: "cozinha", disponivel: true },
  { id: "c-12", nome: "Moqueca de peixe (2 pessoas)", categoria: "Principais", precoEmCentavos: 15900, destino: "cozinha", disponivel: true },
  { id: "c-13", nome: "Risoto de camarao", categoria: "Principais", precoEmCentavos: 8900, destino: "cozinha", disponivel: true },
  { id: "c-14", nome: "Hamburguer da casa", categoria: "Principais", precoEmCentavos: 4890, destino: "cozinha", disponivel: true },
  { id: "c-15", nome: "Batata frita com cheddar", categoria: "Acompanhamentos", precoEmCentavos: 2990, destino: "cozinha", disponivel: true },
  { id: "c-16", nome: "Arroz branco", categoria: "Acompanhamentos", precoEmCentavos: 1290, destino: "cozinha", disponivel: true },
  { id: "c-17", nome: "Farofa da casa", categoria: "Acompanhamentos", precoEmCentavos: 990, destino: "cozinha", disponivel: true },
  { id: "c-18", nome: "Pudim de leite", categoria: "Sobremesas", precoEmCentavos: 1890, destino: "cozinha", disponivel: true },
  { id: "c-19", nome: "Petit gateau", categoria: "Sobremesas", precoEmCentavos: 2490, destino: "cozinha", disponivel: true },
  { id: "c-20", nome: "Espresso duplo", categoria: "Sobremesas", precoEmCentavos: 890, destino: "bar", disponivel: true },
];
