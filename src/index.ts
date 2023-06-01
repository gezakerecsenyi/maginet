import Maginet from './Maginet';
import { PopulatedWindow } from './window';

console.log('Instantiating Maginet...');

const spreadListContainer = document.getElementById('spreads')!;
const previewContainer = document.getElementById('preview')!;
const dataContainer = document.getElementById('data')!;
const mmRuler = document.getElementById('mm')!;
const ptRuler = document.getElementById('pt')!;

(window as PopulatedWindow).debug = true;

const maginet = new Maginet(spreadListContainer, previewContainer, dataContainer, mmRuler, ptRuler);