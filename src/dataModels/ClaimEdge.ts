import { ItemTypes, Affects, newId } from "@reasonscore/core";

/**
 * Stores the relationship between a claim and an item (usually another claim).
 * This is directional as the edge points from one claim to it's parent.
 * This is just a data transfer object so it should have no logic in it
 * and only JSON compatible types string, number, object, array, boolean
 */
export class ClaimEdge {
    type: ItemTypes = 'claimEdge'
    checked: any;

    constructor(
        /** The ID for the parent claim this edge points to */
        public parentId: string,
        /** The ID for the child claim this edge points from */
        public childId: string,
        /** How the child affects the parent score */
        public affects: Affects = 'confidence',
        /** Is the child claim a pro of it's parent (false if it is a con) */
        public pro: boolean = true,
        public id: string = newId(),
        public priority: string = "",
    ) {
    }
}

export interface iClaimEdge {
    type: ItemTypes

    /** The ID for the parent claim this edge points to */
    parentId: string,
    /** The ID for the child claim this edge points from */
    childId: string,
    /** How the child affects the parent score */
    affects: Affects,
    /** Is the child claim a pro of it's parent (false if it is a con) */
    pro: boolean,
    id: string,
    priority: string,

    /** allow for other properties by external implementations */
    // [others: string]: any;
}