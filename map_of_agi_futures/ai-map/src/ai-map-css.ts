
import { css } from 'lit';


export const style = css`

:host {
    --paper-slider-active-color: var(--google-red-700, red);
    --paper-slider-secondary-color:	var(-google-red-300, pink);
    --paper-slider-knob-color:	var(--google-red-700, red);
    --paper-slider-pin-color:	var(--google-red-700, red);
    /* disabled defaults to --paper-grey-400 */
    /* --paper-slider-disabled-knob-color: var(--paper-grey-400, grey); */
    /*--paper-slider-disabled-active-color: var(--paper-grey-400, grey); */
    --paper-slider-disabled-knob-color: transparent; 
    --paper-slider-disabled-active-color: var(--google-red-700, red);
    --paper-slider-height: 6px; /* 2px default */
}

#graph_svg {
    display: block;
    width: 60em;
    height: fit-content;
}

text.transparent-text {
    opacity: 0;
}


g.edge {
    stroke-linecap: round;
}

`;