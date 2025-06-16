// This is a duplicate of onchain.template.sol for refactoring purposes.
// Begin original template: 

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import {DefaultOperatorFilterer} from "./DefaultOperatorFilterer.sol";
import "./SSTORE2.sol";
import "./DynamicBuffer.sol";
import "./HelperLib.sol";

contract onchain is ERC721A, DefaultOperatorFilterer, ReentrancyGuard, Ownable {
    using HelperLib for uint;
    using DynamicBuffer for bytes;

    struct LinkedTraitDTO { uint[] traitA; uint[] traitB; }
    struct TraitDTO {
        string name;
        string mimetype;
        bytes data;
        bool hide;
        bool useExistingData;
        uint existingDataIndex;
    }
    struct Trait { string name; string mimetype; bool hide; }
    struct ContractData {
        string name;
        string description;
        string image;
        string banner;
        string website;
        uint royalties;
        string royaltiesRecipient;
    }
    struct WithdrawRecipient {
        string name;
        string imageUrl;
        address recipientAddress;
        uint percentage;
    }

    mapping(uint => address[]) internal _traitDataPointers;
    mapping(uint => mapping(uint => Trait)) internal _traitDetails;
    mapping(uint => bool) internal _renderTokenOffChain;
    mapping(uint => mapping(uint => uint[])) internal _linkedTraits;

    uint[15] private PRIME_NUMBERS;
    uint private constant DEVELOPER_FEE = 0; // Can set to 0 for no dev fee
    uint private constant NUM_LAYERS = {{NUM_LAYERS}};
    uint private constant MAX_BATCH_MINT = 20;
    uint[][NUM_LAYERS] private TIERS;
    string[] private LAYER_NAMES = {{LAYER_NAMES_ARRAY}};
    bool private shouldWrapSVG = false;
    string private backgroundColor = "{{BACKGROUND_COLOR}}";
    uint private randomSeedData;

    WithdrawRecipient[] public withdrawRecipients;
    bool public isContractSealed;
    uint public constant maxSupply = {{MAX_SUPPLY}};
    uint public maxPerAddress = {{MAX_PER_ADDRESS}};
    uint public publicMintPrice = {{MINT_PRICE}} ether;
    string public baseURI = "";
    bool public isPublicMintActive;
    bytes32 private merkleRoot = 0;
    uint public allowListPrice = 0;
    uint public maxPerAllowList = 1;
    bool public isAllowListActive;

    ContractData public contractData = ContractData(
        "{{COLLECTION_NAME}}",
        "{{DESCRIPTION}}",
        "{{IMAGE_URL}}",
        "{{BANNER_URL}}",
        "{{WEBSITE_URL}}",
        {{ROYALTIES_BASIS_POINTS}},
        "{{ROYALTIES_ADDRESS}}"
    );

    constructor() ERC721A(unicode"{{COLLECTION_NAME}}", unicode"{{SYMBOL}}") Ownable(msg.sender) {
        {{TIERS_ARRAYS}}
        PRIME_NUMBERS = [823147169916224825307391528014949069340357622154256148689191,239439210107002209100408342483681304951633794994177274881807,931147417701026196725981216508189527323460133287836248716671,881620940286709375756927686087073151589884188606081093706959,655243881460218654410017181868621550334352057041656691604337,308043264033071943254647080990150144301849302687707544552767,577511032852311313897393410587293046739400234012091068864039,691768493742031397614199039242108474419560046070176392220443,197636338835913099229515612260127815566058069514897730698607];
        randomSeedData = uint(keccak256(abi.encodePacked(tx.gasprice,block.number,block.timestamp,block.prevrandao,blockhash(block.number - 1),msg.sender)));
    }

    function hashToSVG(string memory _hash) public view returns (string memory) {
        uint thisTraitIndex;
        bytes memory svgBytes = DynamicBuffer.allocate(1024 * 128);
        svgBytes.appendSafe('<svg width="500" height="500" viewBox="0 0 500 500" version="1.2" xmlns="http://www.w3.org/2000/svg" style="background-color:');
        svgBytes.appendSafe(bytes(backgroundColor));
        svgBytes.appendSafe(';image-rendering:-moz-crisp-edges;image-rendering:-webkit-crisp-edges;image-rendering:pixelated;image-rendering:crisp-edges;shape-rendering:crispEdges;-webkit-optimize-contrast;-ms-interpolation-mode:nearest-neighbor">');

        // Iterate through layers in reverse order so layer 0 appears on top
        for (uint i = NUM_LAYERS; i > 0; i--) {
            uint layerIndex = i - 1;
            thisTraitIndex = HelperLib.parseInt(HelperLib._substring(_hash, (layerIndex * 3), (layerIndex * 3) + 3));
            svgBytes.appendSafe('<image width="500" height="500" preserveAspectRatio="xMidYMid meet" image-rendering="pixelated" shape-rendering="crispEdges" style="-webkit-optimize-contrast;-ms-interpolation-mode:nearest-neighbor" href="data:');
            svgBytes.appendSafe(bytes(_traitDetails[layerIndex][thisTraitIndex].mimetype));
            svgBytes.appendSafe(';base64,');
            svgBytes.appendSafe(bytes(Base64.encode(bytes(SSTORE2.read(_traitDataPointers[layerIndex][thisTraitIndex])))));
            svgBytes.appendSafe('" />');
        }

        svgBytes.appendSafe('</svg>');
        return string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(svgBytes)));
    }

    function tokenURI(uint tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Invalid token");
        require(_traitDataPointers[0].length > 0, "Traits have not been added");

        string memory tokenHash = tokenIdToHash(tokenId);

        bytes memory jsonBytes = DynamicBuffer.allocate(1024 * 128);
        jsonBytes.appendSafe(abi.encodePacked(unicode'{"name":"', contractData.name, " #"));
        jsonBytes.appendSafe(abi.encodePacked(_toString(tokenId), '","description":"', contractData.description, '",'));

        if (bytes(baseURI).length > 0 && _renderTokenOffChain[tokenId]) {
            jsonBytes.appendSafe(abi.encodePacked('"image":"', baseURI, _toString(tokenId), "?dna=", tokenHash, '&network=mainnet",'));
        } else {
            string memory svgCode = "";
            if (shouldWrapSVG) {
                string memory svgString = hashToSVG(tokenHash);
                svgCode = string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(abi.encodePacked('<svg width="100%" height="100%" viewBox="0 0 1200 1200" version="1.2" xmlns="http://www.w3.org/2000/svg"><image width="1200" height="1200" href="', svgString, '"></image></svg>'))));
                jsonBytes.appendSafe(abi.encodePacked('"svg_image_data":"', svgString, '",'));
            } else {
                svgCode = hashToSVG(tokenHash);
            }
            jsonBytes.appendSafe(
                abi.encodePacked('"image":"', svgCode, '",')
            );
        }

        jsonBytes.appendSafe(abi.encodePacked('"attributes":', hashToMetadata(tokenHash), "}"));
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(jsonBytes)));
    }

    modifier whenMintActive() {
        require(isMintActive(), "Minting is not active");
        _;
    }

    modifier whenUnsealed() {
        require(!isContractSealed, "Contract is sealed");
        _;
    }

    receive() external payable {
        require(isPublicMintActive, "Public minting is not active");
        handleMint(msg.value / publicMintPrice, msg.sender);
    }

    function rarityGen(uint randinput, uint rarityTier) internal view returns (uint) {
        uint currentLowerBound = 0;
        for (uint i = 0; i < TIERS[rarityTier].length; i++) {
            uint thisPercentage = TIERS[rarityTier][i];
            if (randinput >= currentLowerBound && randinput < currentLowerBound + thisPercentage) return i;
            currentLowerBound = currentLowerBound + thisPercentage;
        }
        revert();
    }

    function entropyForExtraData() internal view returns (uint24) {
        uint randomNumber = uint(keccak256(abi.encodePacked(tx.gasprice, block.number, block.timestamp, block.prevrandao, blockhash(block.number - 1), msg.sender)));
        return uint24(randomNumber);
    }

    function stringCompare(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function tokensAreDuplicates(uint tokenIdA, uint tokenIdB) public view returns (bool) {
        return stringCompare(tokenIdToHash(tokenIdA), tokenIdToHash(tokenIdB));
    }

    function reRollDuplicate(uint tokenIdA, uint tokenIdB) public whenUnsealed {
        require(tokensAreDuplicates(tokenIdA, tokenIdB), "All tokens must be duplicates");
        uint largerTokenId = tokenIdA > tokenIdB ? tokenIdA : tokenIdB;
        if (msg.sender != owner()) {
            require(msg.sender == ownerOf(largerTokenId), "Only the token owner or contract owner can re-roll");
        }
        _initializeOwnershipAt(largerTokenId);
        if (_exists(largerTokenId + 1)) {
            _initializeOwnershipAt(largerTokenId + 1);
        }
        _setExtraDataAt(largerTokenId, entropyForExtraData());
    }

    function _extraData(address from, address, uint24 previousExtraData) internal view virtual override returns (uint24) {
        return from == address(0) ? 0 : previousExtraData;
    }

    function getTokenSeed(uint tokenId) internal view returns (uint24) {
        return _ownershipOf(tokenId).extraData;
    }

    function tokenIdToHash(uint tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Invalid token");
        bytes memory hashBytes = DynamicBuffer.allocate(NUM_LAYERS * 4);
        uint[] memory hash = new uint[](NUM_LAYERS);
        bool[] memory modifiedLayers = new bool[](NUM_LAYERS);
        uint traitSeed = randomSeedData % maxSupply;
        for (uint i = 0; i < NUM_LAYERS; i++) {
            uint traitIndex = hash[i];
            if (modifiedLayers[i] == false) {
                uint tokenExtraData = getTokenSeed(tokenId);
                uint traitRangePosition;
                if (tokenExtraData == 0) {
                    traitRangePosition = ((tokenId + i + traitSeed) * PRIME_NUMBERS[i]) % maxSupply;
                } else {
                    traitRangePosition = uint(keccak256(abi.encodePacked(tokenExtraData, tokenId, tokenId + i))) % maxSupply;
                }
                traitIndex = rarityGen(traitRangePosition, i);
                hash[i] = traitIndex;
            }
            if (_linkedTraits[i][traitIndex].length > 0) {
                hash[_linkedTraits[i][traitIndex][0]] = _linkedTraits[i][traitIndex][1];
                modifiedLayers[_linkedTraits[i][traitIndex][0]] = true;
            }
        }
        for (uint i = 0; i < hash.length; i++) {
            if (hash[i] < 10) {
                hashBytes.appendSafe("00");
            } else if (hash[i] < 100) {
                hashBytes.appendSafe("0");
            }
            if (hash[i] > 999) {
                hashBytes.appendSafe("999");
            } else {
                hashBytes.appendSafe(bytes(_toString(hash[i])));
            }
        }
        return string(hashBytes);
    }

    function handleMint(uint256 count, address recipient) internal whenMintActive returns (uint256) {
        uint256 totalMinted = _totalMinted();
        require(count > 0, "Invalid token count");
        require(totalMinted + count <= maxSupply, "All tokens are gone");
        if (isPublicMintActive) {
            if (msg.sender != owner()) {
                require(_numberMinted(msg.sender) + count <= maxPerAddress, "Exceeded max mints allowed");
                require(count * publicMintPrice == msg.value, "Incorrect amount of ether sent");
            }
            require(msg.sender == recipient, "Only direct mints allowed");
        }
        uint256 batchCount = count / MAX_BATCH_MINT;
        uint256 remainder = count % MAX_BATCH_MINT;
        for (uint256 i = 0; i < batchCount; i++) {
            _mint(recipient, MAX_BATCH_MINT);
        }
        if (remainder > 0) {
            _mint(recipient, remainder);
        }
        return totalMinted;
    }

    function mint(uint256 count, bytes32[] calldata merkleProof) external payable nonReentrant whenMintActive returns (uint) {
        if (!isPublicMintActive && msg.sender != owner()) {
            require(onAllowList(msg.sender, merkleProof), "Not on allow list");
            require(_numberMinted(msg.sender) + count <= maxPerAllowList, "Exceeded max mints allowed");
            require(count * allowListPrice == msg.value, "Incorrect amount of ether sent");
        }
        return handleMint(count, msg.sender);
    }

    function airdrop(uint256 count, address recipient) external payable nonReentrant whenMintActive returns (uint) {
        require(isPublicMintActive || msg.sender == owner(), "Public minting is not active");
        return handleMint(count, recipient);
    }

    function isMintActive() public view returns (bool) {
        return _totalMinted() < maxSupply && (isPublicMintActive || isAllowListActive || msg.sender == owner());
    }

    function hashToMetadata(string memory _hash) public view returns (string memory) {
        bytes memory metadataBytes = DynamicBuffer.allocate(1024 * 128);
        metadataBytes.appendSafe("[");
        bool afterFirstTrait;
        for (uint i = 0; i < NUM_LAYERS; i++) {
            uint thisTraitIndex = HelperLib.parseInt(HelperLib._substring(_hash, (i * 3), (i * 3) + 3));
            if (_traitDetails[i][thisTraitIndex].hide == false) {
                if (afterFirstTrait) {
                    metadataBytes.appendSafe(",");
                }
                metadataBytes.appendSafe(abi.encodePacked('{"trait_type":"', LAYER_NAMES[i], '","value":"', _traitDetails[i][thisTraitIndex].name, '"}'));
                if (afterFirstTrait == false) {
                    afterFirstTrait = true;
                }
            }
            if (i == NUM_LAYERS - 1) {
                metadataBytes.appendSafe("]");
            }
        }
        return string(metadataBytes);
    }

    function onAllowList(address addr, bytes32[] calldata merkleProof) public view returns (bool) {
        return MerkleProof.verify(merkleProof, merkleRoot, keccak256(abi.encodePacked(addr)));
    }

    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(abi.encodePacked('{"name":"', contractData.name, '","description":"', contractData.description, '","image":"', contractData.image, '","banner":"', contractData.banner, '","external_link":"', contractData.website, '","seller_fee_basis_points":', _toString(contractData.royalties), ',"fee_recipient":"', contractData.royaltiesRecipient, '"}'))));
    }

    function tokenIdToSVG(uint tokenId) public view returns (string memory) {
        return hashToSVG(tokenIdToHash(tokenId));
    }

    function traitDetails(uint layerIndex, uint traitIndex) public view returns (Trait memory) {
        return _traitDetails[layerIndex][traitIndex];
    }

    function traitData(uint layerIndex, uint traitIndex) public view returns (string memory) {
        return string(SSTORE2.read(_traitDataPointers[layerIndex][traitIndex]));
    }

    function getLinkedTraits(uint layerIndex, uint traitIndex) public view returns (uint[] memory) {
        return _linkedTraits[layerIndex][traitIndex];
    }

    function addLayer(uint layerIndex, TraitDTO[] memory traits) public onlyOwner whenUnsealed {
        require(TIERS[layerIndex].length == traits.length, "Traits size does not match tiers for this index");
        address[] memory dataPointers = new address[](traits.length);
        for (uint i = 0; i < traits.length; i++) {
            if (traits[i].useExistingData) {
                dataPointers[i] = dataPointers[traits[i].existingDataIndex];
            } else {
                dataPointers[i] = SSTORE2.write(traits[i].data);
            }
            _traitDetails[layerIndex][i] = Trait(traits[i].name, traits[i].mimetype, traits[i].hide);
        }
        _traitDataPointers[layerIndex] = dataPointers;
        return;
    }

    function addTrait(uint layerIndex, uint traitIndex, TraitDTO memory trait) public onlyOwner whenUnsealed {
        _traitDetails[layerIndex][traitIndex] = Trait(trait.name, trait.mimetype, trait.hide);
        address[] memory dataPointers = _traitDataPointers[layerIndex];
        if (trait.useExistingData) {
            dataPointers[traitIndex] = dataPointers[trait.existingDataIndex];
        } else {
            dataPointers[traitIndex] = SSTORE2.write(trait.data);
        }
        _traitDataPointers[layerIndex] = dataPointers;
        return;
    }

    function setLinkedTraits(LinkedTraitDTO[] memory linkedTraits) public onlyOwner whenUnsealed {
        for (uint i = 0; i < linkedTraits.length; i++) {
            _linkedTraits[linkedTraits[i].traitA[0]][linkedTraits[i].traitA[1]] = [linkedTraits[i].traitB[0], linkedTraits[i].traitB[1]];
        }
    }

    function setContractData(ContractData memory data) external onlyOwner whenUnsealed {
        contractData = data;
    }

    function setMaxPerAddress(uint max) external onlyOwner {
        maxPerAddress = max;
    }

    function setBaseURI(string memory uri) external onlyOwner {
        baseURI = uri;
    }

    function setBackgroundColor(string memory color) external onlyOwner whenUnsealed {
        backgroundColor = color;
    }

    function setRenderOfTokenId(uint tokenId, bool renderOffChain) external {
        require(msg.sender == ownerOf(tokenId), "Only the token owner can set the render method");
        _renderTokenOffChain[tokenId] = renderOffChain;
    }

    function setMerkleRoot(bytes32 newMerkleRoot) external onlyOwner {
        merkleRoot = newMerkleRoot;
    }

    function setMaxPerAllowList(uint max) external onlyOwner {
        maxPerAllowList = max;
    }

    function setAllowListPrice(uint price) external onlyOwner {
        allowListPrice = price;
    }

    function toggleAllowListMint() external onlyOwner {
        isAllowListActive = !isAllowListActive;
    }

    function toggleOperatorFilter() external onlyOwner {
        isOperatorFilterEnabled = !isOperatorFilterEnabled;
    }

    function toggleWrapSVG() external onlyOwner {
        shouldWrapSVG = !shouldWrapSVG;
    }

    function togglePublicMint() external onlyOwner {
        isPublicMintActive = !isPublicMintActive;
    }

    function sealContract() external whenUnsealed onlyOwner {
        isContractSealed = true;
    }

    function withdraw() external onlyOwner nonReentrant {
        uint balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        Address.sendValue(payable(owner()), balance);
    }

    function transferFrom(address from, address to, uint256 tokenId) public payable override onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public payable override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public payable override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId, data);
    }
} 