pragma solidity 0.4.24;

contract Remote {
    event Called(address caller);

    function receiveCall() public {
        emit Called(msg.sender);
    }
}
