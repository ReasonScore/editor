import React from 'react';
import { RepositoryLocalPure, Claim, Score, Messenger, iScore, Action, iClaimEdge } from "@reasonscore/core";
import EditorElement from './EditorElement';

const commonmark: any = require('commonmark');

type MyProps = {
    scoreId: string,
    repository: RepositoryLocalPure,
    proMainContext: boolean,
    messenger: Messenger,
};

type MyState = {
    childrenVisible: boolean,
    editorVisible: boolean,
    addMode: boolean,
    score: iScore,
    claim: Claim,
    childScores: iScore[],
    claimEdge?: iClaimEdge,
};

class ScoreElement extends React.Component<MyProps, MyState> {

    constructor(props: MyProps) {
        super(props);
        this.state = {
            childrenVisible: false,
            editorVisible: false,
            addMode: false,
            score: new Score("", ""),
            claim: new Claim(),
            childScores: [],
            claimEdge: undefined,
        };


    }

    async componentDidMount() {
        const score = await this.props.repository.getScore(this.props.scoreId);
        let claim = new Claim();
        let childrenVisible = this.state.childrenVisible;
        if (score) {
            let claimEdge: iClaimEdge | undefined;
            if (score.sourceEdgeId) {
                claimEdge = await this.props.repository.getClaimEdge(score.sourceEdgeId)
            }
            const claimResult = await this.props.repository.getClaim(score.sourceClaimId);
            const childScores = await this.props.repository.getChildrenByScoreId(score.id);
            if (!score.parentScoreId) {
                childrenVisible = true;
            }
            if (claimResult) {
                claim = claimResult as Claim;
            }
            this.setState({
                score: score,
                claim: claim,
                childScores: childScores,
                childrenVisible: childrenVisible,
                claimEdge: claimEdge
            });
        }

        this.props.messenger.subscribe(this.handleDataDispatch)
    }

    componentWillUnmount() {
        //TODO:
        this.props.messenger.unsubscribe(this.handleDataDispatch)
    }

    //TODO:
    handleDataDispatch = async (actions: Action[]) => {
        for (const change of actions) {
            const { newData, type, dataId, oldData } = change;
            let newState: any = {}
            if (type === "modify_claim" && dataId === this.state.claim.id) {
                newState.claim = { ...this.state.claim, ...newData };
            }

            if (type === "modify_claimEdge" && this.state.claimEdge && dataId === this.state.claimEdge.id) {
                newState.claimEdge = { ...this.state.claimEdge, ...newData };
            }

            if (type === "delete_claimEdge" && oldData.parentId === this.state.claim.id) {
                newState.childScores = await this.props.repository.getChildrenByScoreId(this.state.score.id);
            }

            if (type === "modify_score" && dataId === this.state.score.id) {
                newState.score = { ...this.state.score, ...newData };
            }

            if (type === "add_score" && newData.parentScoreId === this.state.score.id) {
                const childScores = await this.props.repository.getChildrenByScoreId(this.state.score.id);
                newState.childScores = childScores;
            }

            this.setState(newState);
        }
    }

    handleExpanderClick = () => {
        this.setState({
            childrenVisible: !this.state.childrenVisible
        });
    }

    handleEditButtonClick = () => {
        this.setState({
            editorVisible: !this.state.editorVisible,
            addMode: false,
        });
    }

    handleAddButtonClick = () => {
        this.setState({
            addMode: true,
            editorVisible: !this.state.editorVisible
        });
    }

    handleEditClose = () => {
        this.setState({
            editorVisible: false
        });
    }

    render() {
        const props = this.props;
        let score = this.state.score;
        if (!score) { score = new Score("", "") } //TODO: Review this line
        const claim = this.state.claim;
        //const claimEdge = this.state.claimEdge;
        const childScores = this.state.childScores;
        let proMain = props.proMainContext;
        let scoreText = `${Math.round(score.confidence * 100)}%`
        if (score) {
            if (!score.pro) {
                proMain = !proMain;
            }
            if (score.affects === "relevance") {
                scoreText = `×${(score.relevance + 1).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}`;
            } else {
                scoreText = `${Math.round(score.confidence * score.relevance * 100)}`
            }
        }

        //Prioritize the children for the display order
        //TODO: move this to the repository to reduce duplicate processing
        let childScoresSorted = childScores;
        if (childScores.length > 1) {
            childScoresSorted = childScores.sort((a, b) => {
                if ((a.priority === undefined || a.priority === "") && (b.priority === undefined || b.priority === "")) {
                    return 0;
                }
                if ((a.priority === undefined || a.priority === "")) {
                    return 1;
                }
                if ((b.priority === undefined || b.priority === "")) {
                    return -1;
                }
                if (a.priority > b.priority) {
                    return 1;
                }
                if (a.priority < b.priority) {
                    return -1;
                }
                return 0;
            });

        }


        const proMainText = proMain ? "pro" : "con";

        //Commonmark
        function createMarkup() {
            var reader = new commonmark.Parser({});
            var writer = new commonmark.HtmlRenderer({ safe: true });
            var parsed = reader.parse(claim.content);
            return { __html: writer.render(parsed) };
        }

        return (
            <div className={'claim-outer'}>
                <div className={'claim ' + proMainText} >
                    <div className={'editor-button'} onClick={this.handleEditButtonClick}><svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 0 48 48" width="15"><path d="M6 34.5v7.5h7.5l22.13-22.13-7.5-7.5-22.13 22.13zm35.41-20.41c.78-.78.78-2.05 0-2.83l-4.67-4.67c-.78-.78-2.05-.78-2.83 0l-3.66 3.66 7.5 7.5 3.66-3.66z" /><path d="M0 0h48v48h-48z" fill="none" /></svg></div>
                    <div className={'add-button'} onClick={this.handleAddButtonClick}>+</div>
                    {childScores.length > 0 &&
                        <div className={"expander" + (this.state.childrenVisible ? " expanded" : " collapsed")} onClick={this.handleExpanderClick} >
                            &#9701;
                        </div>
                    }
                    <div className={'claim-inner'}>
                        <div className="lines">
                            <div className="lines-circle-container" >
                                <div className="lines-circle" style={{ left: score.confidence * 100 + "%" }}></div>
                            </div>
                            <div className="lines-inner"></div>

                        </div>
                        <span className={`score`}>
                            {scoreText}
                        </span>
                        <span dangerouslySetInnerHTML={createMarkup()}>
                        </span>
                    </div>
                </div>
                {this.state.editorVisible &&
                    <EditorElement
                        claimId={claim.id}
                        repository={props.repository}
                        claimEdge={this.state.claimEdge}
                        proMainContext={this.state.addMode ? proMain : props.proMainContext}
                        handleEditClose={this.handleEditClose}
                        messenger={props.messenger}
                        new={this.state.addMode}
                    />}

                {this.state.childrenVisible &&
                    <ul className="children">
                        {childScores.length > 0 && childScoresSorted.map((child) => (
                            <li key={child.id.toString()}>
                                <ScoreElement
                                    scoreId={child.id}
                                    repository={props.repository}
                                    proMainContext={proMain}
                                    messenger={props.messenger}
                                />
                            </li>
                        ))}
                    </ul>
                }
            </div>
        );
    }
}

export default ScoreElement;