// contracts/ThatsFanToken.sol
// SPDX-License-Identifier: Apache-2.0
// Developer: Adamantic Development Team <dev@adamantic.io>
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title ThatsFan ERC20 Token
 * @author Adamantic Development Team <dev@adamantic.io>
 * @custom:security-contact dev@adamantic.io
 * @notice This contract implements an ERC-20 token with some additional functionality:
 *         - upgradeability
 *         - role-based access control with MINTER_ROLE, BURNER_ROLE, OPERATOR_ROLE
 *         - mintable / burnable until the contract owner locks the supply forever
 *         - transferrable across wallets by operators until the contract owner locks such feature forever (this supports phase-1 pre-DEX of the platform)
 *         - pause / unpause functions, only actionable by operators, to inhibit/resume token transfer
 */

contract ThatsFanToken is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, PausableUpgradeable, AccessControlUpgradeable, OwnableUpgradeable {

    /**
     * @dev Emitted when the operator functionality is disabled by `account`.
     *      This will happen only once, when the contract owner locks the operator functionality forever.
     */
    event OperatorsDisabled(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     *      This will happen only once, when the contract owner locks the supply forever.
     */
    event SupplyLocked(address account);

    /// @dev role to mint additional supply until `supplyLocked` is activated
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev role to burn supply until `supplyLocked` is activated
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /** 
     * @dev role to perform operator actions
     *      (i.e. move tokens across addresses, pause and unpause the contract).
     *      The operator token transfer functions will only work until
     *      `operatorLocked` is activated, then they will be inhibited forever.
     */
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /** 
     * @dev deactivates the `OPERATOR_ROLE` right to move tokens across addresses,
     *      but does not inhibit contract pausing and unpausing from operators.
     *      It is initially false and, once set to true, it will stay forever.
     */
    bool private operatorLocked;

    /**
     * @dev deactivates the `MINTER_ROLE` and `BURNER_ROLE` - i.e. it locks the supply.
     *      It is initially false and, once set to true, it will stay forever.
     */
    bool private supplyLocked;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @dev classic upgradeable contract initialization
    function initialize(string memory name, string memory symbol, uint256 supply) initializer public {

        __ERC20_init(name, symbol);
        __ERC20Burnable_init();
        __Pausable_init();
        __Ownable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _mint(msg.sender, supply);

        // lock flag initialization
        operatorLocked = false;
        supplyLocked = false;
    }

    /// @dev allows operators to pause the contract
    function pause() public onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    /// @dev allows the owner to enable operator locking (i.e., their ability to transfer tokens around)
    function disableOperators() public onlyOwner {
        operatorLocked = true;
        emit OperatorsDisabled(msg.sender);
    }

    /// @dev allows the owner to lock the supply (i.e., disables minting and burning)
    function disableModifySupply() public onlyOwner {
        supplyLocked = true;
        emit SupplyLocked(msg.sender);
    }

    /// @dev allows operators to unpause the contract
    function unpause() public onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    /// @dev allows operators to transfer across wallets until `operatorLocked` is activated
    function operatorTransferFrom(address from, address to, uint256 amount) public onlyRole(OPERATOR_ROLE) returns (bool) {
        require(!operatorLocked, "OperatorTransfer: disabled functionality.");
        _transfer(from, to, amount);
        return true;
    }

    /// @dev allows minters to increase the supply by creating new tokens into a specific address
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(!supplyLocked, "Fixed supply. Mint blocked.");
        _mint(to, amount);
    }

    /// @dev allows burners - only if their allowance permits - to burn a certain amount from a specific address
    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        require(!supplyLocked, "Fixed supply. Burn blocked.");
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    /*
     * @dev implements the classical OpenZeppelin token 'before transfer' hook
     *      to inhibit any kind of transfer when the contract is paused.
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount)
    internal
    whenNotPaused
    override
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
