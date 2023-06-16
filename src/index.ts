import Maginet from './Maginet';

const spreadListContainer = document.getElementById('spreads')!;
const previewContainer = document.getElementById('preview')!;
const dataContainer = document.getElementById('data')!;
const mmRuler = document.getElementById('mm')!;
const ptRuler = document.getElementById('pt')!;

const maginet = new Maginet(spreadListContainer, previewContainer, dataContainer, mmRuler, ptRuler);