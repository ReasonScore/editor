import React from 'react';
import { RepositoryLocalPure} from "@reasonscore/core";

declare global {
    interface Window {
      db: any;
    }
  }

type MyProps = {
    repository: RepositoryLocalPure,
};

type MyState = {

};

class Menu extends React.Component<MyProps, MyState> {


    // constructor(props: MyProps) {
    //     super(props);
    // }

    handleSave = () => {
        window.db.doc("rsData").set(JSON.parse(JSON.stringify(this.props.repository.rsData)))
        .then(function() {
            console.log("Document successfully written!");
        })
        .catch(function(error: any) {
            console.error("Error writing document: ", error);
        });
    }

    render() {
        return (
            <button style={{display:"none"}} type="button" value="Save" className="btn btn-secondary" onClick={this.handleSave}>Save</button>
        );
    }
}

export default Menu;