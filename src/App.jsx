import { useState } from 'react'
import { ethers } from 'ethers'
import Web3 from 'web3'
import {abi, byteCode} from './Constants.json'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [clientAcc, setClientAcc] = useState(null)
  const [etherProvider, setEtherProvider] = useState(null)
  const [webProvider, setWebProvider] = useState(null)
  const [dummyEscrowContract, setDummyEscrowContract] = useState("");
  const [signedContract, setSignedContract] = useState(null);
  const [escrowAmount, setEscrowAmount] = useState(null)
  const deployContract = async () => {
    console.log('deploying contract...')
    try {
      if(clientAcc){
        if(document.getElementById('address').value.trim() == ""){
          alert('freelancer\'s address not detected')
        }

        const freelacerAddress = document.getElementById('address').value;

        const escrowContractFactory = new ethers.ContractFactory(abi, byteCode, clientAcc)
    
        console.log("deploying contract ...")
        const escrow = await escrowContractFactory.deploy(freelacerAddress, {value: ethers.parseEther(`${document.getElementById('amount').value}`)})
        await escrow.waitForDeployment();
        console.log('escrow contract deployed successfully on: ', await escrow.getAddress())
    
        const add = await escrow.getAddress()
        setDummyEscrowContract(add)
      }
      else{
        alert('address not detected')
      }
    } catch (error) {
      console.log('error while deploying the contract', error)
    }
  }

  const connectWallet = async() => {
        if(!window.ethereum){
            console.log('no wallet');
            return 
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if(!accounts.length){
            console.log('no accounts!')
            return;
        }

        try {
            const Eprovider = new ethers.BrowserProvider(window.ethereum);
            const Esigner = await Eprovider.getSigner();
    
            setEtherProvider(Eprovider)
            setClientAcc(Esigner);

            console.log(Esigner)
    
    
    
            const Wprovider = new Web3(window.ethereum);
            setWebProvider(Wprovider);
        } catch (error) {
            console.error(`while setting up provider: `, error);
        }
    }


    const fetchAmount = async () => {
        const contractSigned = new ethers.Contract(dummyEscrowContract, abi, clientAcc);
        setSignedContract(contractSigned)
        if (contractSigned) {
            try {
                console.log(contractSigned)
                const EscrowAmount = await contractSigned.amount(); 
                const clientApp = await contractSigned.clientApproval();
                const freelancerApp = await contractSigned.freelancerApproval();
                setEscrowAmount(ethers.formatEther(EscrowAmount));
                console.log(ethers.formatEther(EscrowAmount), "ETH")
                console.log('client: ', clientApp)
                console.log('feelancer: ', freelancerApp)
                if(clientApp && freelancerApp){
                  const releaseFunds = await contractSigned.releaseFundsIfApproved();
                  console.log(await etherProvider.getBalance(clientAcc.address));
                  await releaseFunds.wait();
                  console.log(releaseFunds)
                  console.log(await etherProvider.getBalance(clientAcc.address))
                }
            } catch (error) {
                console.error("Error fetching the amount:", error);
            }
        } else {
            alert("Contract not loaded yet. Connect to wallet first.");
        }
    };


    const clientApproval = async () => {
      const contractSigned = new ethers.Contract(dummyEscrowContract, abi, clientAcc);
      setSignedContract(contractSigned)
      if(contractSigned){
        try {
         const clientApprovalCall = await contractSigned.approveByClient() 
         await clientApprovalCall.wait()
         console.log(clientApprovalCall)
         console.log('client has approved!!');
        } catch (error) {
          console.log('error while approving by client', error)
        }
      } 
      else{
        alert("conract not loaded yet. Connect to wallet first");
      }
    }
    
    const freelancerApproval = async() => {
      const contractSigned = new ethers.Contract(dummyEscrowContract, abi, clientAcc);
      setSignedContract(contractSigned)
      if(contractSigned){
        try {
         const freelancerApprovalCall = await contractSigned.approveByFreelancer() 
         await freelancerApprovalCall.wait()
         console.log(freelancerApprovalCall)
         console.log('freelancer has approved!!');
        } catch (error) {
          console.log('error while approving by client', error)
        }
      } 
      else{
        alert("conract not loaded yet. Connect to wallet first");
      }

    }

  return (
    <div className='flex flex-col justify-center items-center w-full gap-y-3'>

      <div>
        <button className="px-3 py-2 text-2xl bg-gray-300 rounded-lg" onClick={connectWallet}>Connect Wallet</button>
      </div>

     <div className='flex flex-col gap-y-3 justify-center items-center'>
        <span className='text-xl font-sans'>Deploy an Escrow Contract</span>
        <div className='flex text-xl gap-x-3'>
          <div className='flex gap-x-4'>
            <label htmlFor='address'>Freelancer's address
              <input type='text' className='bg-gray-300 rounded-lg' id='address'/>
            </label>
            <label htmlFor='amount'>amount
              <input type='number' className='bg-gray-300 rounded-lg' id='amount'/>
            </label>
          </div>
          <button className='px-3 py-1 bg-gray-300 text-xl font-sans rounded-lg' onClick={deployContract}>Deploy</button>
        </div>
      </div> 
    
      <div>
        <button className='px-3 py-1 bg-gray-300 text-xl font-sans rounded-lg' onClick={fetchAmount}>Fetch amount</button>
        {escrowAmount? <div>{escrowAmount}ETH</div> : <></>}
      </div>

      <div>
        <button className='px-3 py-1 bg-gray-300 text-xl font-sans rounded-lg' onClick={clientApproval}>
          Approve Transaction
        </button>
      </div>
      <div>
        <button className='px-3 py-1 bg-gray-300 text-xl font-sans rounded-lg' onClick={freelancerApproval}>
          freelancer Approve Transaction
        </button>
      </div>
      <div>
        <button className='px-3 py-1 bg-gray-300 text-xl font-sans rounded-lg' onClick={async() => {const bal = await etherProvider.getBalance(clientAcc.address); console.log(ethers.formatEther(`${bal}`))}}>
          show balance
        </button>
      </div>
    </div>
  )
}

export default App

