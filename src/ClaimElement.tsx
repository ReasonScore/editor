import React from 'react';
//import Editor from './Editor';
//import ClaimInner from './ClaimInner';
//import { CSSTransitionGroup } from 'react-transition-group';
import { Repository, CalculationInitator, Claim, ClaimEdge, Id, Affects } from "@reasonscore/core";
import EditorElement from './EditorElement';

type MyProps = {
    claimId: Id,
    repository: Repository,
    calculationInitator: CalculationInitator,
    proMainContext: boolean,
    claimEdge?: ClaimEdge,
};

type MyState = {
    childrenVisible: boolean,
    editorVisible: boolean
};

class ClaimElement extends React.Component<MyProps, MyState> {
    state: MyState = {
        childrenVisible: false,
        editorVisible: false
    };

    handleExpanderClick = () => {
        this.setState({
            childrenVisible: !this.state.childrenVisible
        });
    }
    handleEditButtonClick = () => {
        this.setState({
            editorVisible: !this.state.editorVisible
        });
    }

    handleEditCancel = () => {
        this.setState({
            editorVisible: false
        });
    }

    render() {
        const props = this.props;
        const score = props.repository.getScoreBySourceClaimId(props.claimId);
        const claim = props.repository.getItem(props.claimId) as Claim || new Claim();
        const childClaimEedges = props.repository.getClaimEdgesByParentId(props.claimId)
        let proMain = props.proMainContext;
        let scoreText = `${Math.round(score.confidence * 100)}%`
        if (props.claimEdge) {
            if (!props.claimEdge.pro) {
                proMain = !proMain;
            }
            if (props.claimEdge.affects === Affects.Relevance) {
                scoreText = `×${(score.relevance + 1).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}`;
            } else {
                scoreText = `${Math.round(score.confidence * score.relevance * 100)}`
            }
        }

        let childrenMaxHeight = this.state.childrenVisible ? childClaimEedges.length * 300 + 'px' : '0'
        const proMainText = proMain ? "pro" : "con";

        return (
            <div className={'claim-outer'}>
                <div className={'claim ' + proMainText} >
                    <div className={'editor-button'} onClick={this.handleEditButtonClick}>E</div>
                    {childClaimEedges.length > 0 &&
                        <div className={"expander" + (this.state.childrenVisible ? " expanded" : " collapsed")} onClick={this.handleExpanderClick} >
                            &#9701;
                    </div>
                    }
                    <div className={'claim-inner'}>
                        <span className={`score`}>
                            {scoreText}
                        </span>
                        <span>
                            {claim.content}
                        </span>
                    </div>
                </div>
                {this.state.editorVisible &&
                    <EditorElement
                        claimId={claim.id}
                        repository={props.repository}
                        calculationInitator={props.calculationInitator}
                        claimEdge={props.claimEdge}
                        proMainContext={proMain}
                        handleEditCancel={this.handleEditCancel}
                    />}
                <ul className="children" style={{
                    maxHeight: childrenMaxHeight
                }}>
                    {childClaimEedges.length > 0 && childClaimEedges.map((child) => (
                        <li key={child.childId.toString()}>
                            <ClaimElement
                                claimId={child.childId}
                                repository={props.repository}
                                calculationInitator={props.calculationInitator}
                                claimEdge={child}
                                proMainContext={proMain}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}

export default ClaimElement;