import { DefaultParameterId, ToolType } from '../../types';
import { TextSpan } from '../TextSpan';
import ToolbarOption from './ToolbarOption';

export const toolbarOptionList: ToolbarOption<any>[] = [
    new ToolbarOption({
        tooltip: 'Cursor',
        optionType: ToolType.Cursor,
    }),
    new ToolbarOption({
        tooltip: 'Text',
        optionType: ToolType.Text,
        suboptions: [
            new ToolbarOption({
                tooltip: 'Rich text',
                optionType: ToolType.RichText,
            }),
            new ToolbarOption({
                tooltip: 'Text frame',
                optionType: ToolType.TextFragment,
                insertableByDrag: {
                    component: TextSpan,
                    bindWidthTo: [DefaultParameterId.Width],
                },
            }),
        ],
    }),
    new ToolbarOption({
        tooltip: 'Image',
        optionType: ToolType.Image,
        insertableByDrag: {
            component: TextSpan,
            bindWidthTo: [DefaultParameterId.Width],
            bindHeightTo: [DefaultParameterId.Height],
        },
    }),
    new ToolbarOption({
        tooltip: 'Shape',
        optionType: ToolType.Shape,
        suboptions: [
            new ToolbarOption({
                tooltip: 'Circle',
                optionType: ToolType.Circle,
                insertableByDrag: {
                    component: TextSpan,
                    bindWidthTo: [DefaultParameterId.Width],
                    bindHeightTo: [DefaultParameterId.Height],
                },
            }),
            new ToolbarOption({
                tooltip: 'Rectangle',
                optionType: ToolType.Rectangle,
                insertableByDrag: {
                    component: TextSpan,
                    bindWidthTo: [DefaultParameterId.Width],
                    bindHeightTo: [DefaultParameterId.Height],
                },
            }),
            new ToolbarOption({
                tooltip: 'Triangle',
                optionType: ToolType.Triangle,
                insertableByDrag: {
                    component: TextSpan,
                    bindWidthTo: [DefaultParameterId.Width],
                    bindHeightTo: [DefaultParameterId.Height],
                },
            }),
        ],
    }),
    new ToolbarOption({
        tooltip: 'Node pen',
        optionType: ToolType.Nodes,
    }),
    new ToolbarOption({
        tooltip: 'Insert component...',
        optionType: ToolType.Component,
    }),
];