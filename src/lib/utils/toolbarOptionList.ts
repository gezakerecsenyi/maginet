import { ToolbarOptionData, ToolType } from '../../types';
import { TextSpan } from '../TextSpan';

export const toolbarOptionList: ToolbarOptionData[] = [
    {
        tooltip: 'Cursor',
        optionType: ToolType.Cursor,
    },
    {
        tooltip: 'Text',
        optionType: ToolType.Text,
        suboptions: [
            {
                tooltip: 'Rich text',
                optionType: ToolType.RichText,
            },
            {
                tooltip: 'Text frame',
                optionType: ToolType.TextFragment,
                insertableByDrag: TextSpan,
            },
        ],
    },
    {
        tooltip: 'Image',
        optionType: ToolType.Image,
        insertableByDrag: TextSpan,
    },
    {
        tooltip: 'Shape',
        optionType: ToolType.Shape,
        suboptions: [
            {
                tooltip: 'Circle',
                optionType: ToolType.Circle,
                insertableByDrag: TextSpan,
            },
            {
                tooltip: 'Rectangle',
                optionType: ToolType.Rectangle,
                insertableByDrag: TextSpan,
            },
            {
                tooltip: 'Triangle',
                optionType: ToolType.Triangle,
                insertableByDrag: TextSpan,
            },
        ],
    },
    {
        tooltip: 'Node pen',
        optionType: ToolType.Nodes,
    },
    {
        tooltip: 'Insert component...',
        optionType: ToolType.Component,
    },
];