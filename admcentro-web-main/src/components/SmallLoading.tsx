import React from "react";

const SmallLoading = ({ w = 80, h = 80, round = true }: { w?: number; h?: number, round?: boolean }) => {
    return (
        <div style={{ height: h, width: w }} className={` ${round ? 'lds-default' : 'lds-spinner'} `}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    );
};

export default SmallLoading;
