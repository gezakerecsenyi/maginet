import Maginet from './Maginet';

console.log('hi');

const spreadListContainer = document.getElementById('spreads')!;
const previewContainer = document.getElementById('preview')!;
const dataContainer = document.getElementById('data')!;
const ruler = document.getElementById('mm')!;

const maginet = new Maginet(spreadListContainer, previewContainer, dataContainer, ruler);