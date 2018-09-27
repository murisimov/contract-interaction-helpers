pragma solidity 0.4.24;

import './Remote.sol';


contract Tester {
    address public owner;
    uint256 public data;
    Remote public remote;

    event Error(string message);
    event DataChanged(uint256 to);

    function Tester(Remote _remote, uint256 _data) {
        owner = msg.sender;
        remote = _remote;
        data = _data;
    }

    function changeData(uint256 _data) public returns(bool) {
        if (msg.sender != owner) {
            emit Error("Only owner can change the data");
            return false;
        }
        data = _data;
        emit DataChanged(_data);
        return true;
    }

    function remoteCall() public {
        remote.receiveCall();
    }

}
