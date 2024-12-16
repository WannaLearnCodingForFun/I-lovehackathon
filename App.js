import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

function App() {
  const CONTRACT_ADDRESS = "0x788ff72228dafb0eca5c8c6d8e2d3de1d7324c43";
  const ABI = [
    // Replace with your contract's ABI
  ];

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== "undefined") {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);

        // Listen for account changes
        window.ethereum.on("accountsChanged", async (accounts) => {
          setAccount(accounts[0]);
          const web3Signer = web3Provider.getSigner();
          setSigner(web3Signer);
          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            ABI,
            web3Signer
          );
          setContract(contractInstance);
          await loadItems(contractInstance);
          await loadOwnedItems(contractInstance, accounts[0]);
        });

        // Request accounts
        const accounts = await web3Provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        // Set signer and contract
        const web3Signer = web3Provider.getSigner();
        setSigner(web3Signer);

        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          ABI,
          web3Signer
        );
        setContract(contractInstance);

        // Load items and owned items
        await loadItems(contractInstance);
        await loadOwnedItems(contractInstance, accounts[0]);
      } else {
        setMessage("Please install MetaMask to use this app.");
      }
    };

    init();
  }, []);

  const loadItems = async (contractInstance) => {
    setLoading(true);
    try {
      const itemCount = await contractInstance.itemCount();
      let fetchedItems = [];
      for (let i = 1; i <= itemCount; i++) {
        const item = await contractInstance.items(i);
        fetchedItems.push(item);
      }
      setItems(fetchedItems);
    } catch (error) {
      console.error("Error loading items:", error);
    }
    setLoading(false);
  };

  const loadOwnedItems = async (contractInstance, owner) => {
    try {
      const ownedItemIds = await contractInstance.getItemsByOwner(owner);
      let fetchedOwnedItems = [];
      for (let i = 0; i < ownedItemIds.length; i++) {
        const item = await contractInstance.items(ownedItemIds[i]);
        fetchedOwnedItems.push(item);
      }
      setOwnedItems(fetchedOwnedItems);
    } catch (error) {
      console.error("Error loading owned items:", error);
    }
  };

  const listItem = async (name, price) => {
    setLoading(true);
    setMessage("Processing...");
    try {
      const tx = await contract.listItem(name, ethers.utils.parseEther(price));
      await tx.wait();
      setMessage("Item listed successfully!");
      await loadItems(contract);
    } catch (error) {
      console.error("Error listing item:", error);
      setMessage("Error: Unable to list item.");
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <h1>Marketplace</h1>
      <p>Account: {account}</p>
      {message && <div className="message">{message}</div>}

      <div className="list-item">
        <h2>List Item</h2>
        <input
          id="itemName"
          placeholder="Item Name"
          className="input-field"
        />
        <input
          id="itemPrice"
          placeholder="Item Price (in ETH)"
          className="input-field"
        />
        <button
          className="button"
          onClick={() =>
            listItem(
              document.getElementById("itemName").value,
              document.getElementById("itemPrice").value
            )
          }
          disabled={loading}
        >
          {loading ? "Processing..." : "List Item"}
        </button>
      </div>

      <div className="items">
        <h2>Items for Sale</h2>
        {loading ? (
          <div className="spinner">Loading items...</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="item-card">
              <p>
                <strong>Name:</strong> {item.name}
              </p>
              <p>
                <strong>Price:</strong>{" "}
                {ethers.utils.formatEther(item.price)} ETH
              </p>
              <p>
                <strong>Owner:</strong> {item.owner}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="owned-items">
        <h2>My Owned Items</h2>
        {loading ? (
          <div className="spinner">Loading owned items...</div>
        ) : (
          ownedItems.map((item) => (
            <div key={item.id} className="item-card">
              <p>
                <strong>Name:</strong> {item.name}
              </p>
              <p>
                <strong>Price:</strong>{" "}
                {ethers.utils.formatEther(item.price)} ETH
              </p>
              <p>
                <strong>Owner:</strong> {item.owner}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
