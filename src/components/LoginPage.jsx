import { Fragment, useState } from "react";
import Navbar from "./Navbar";
import { X } from "lucide-react";
import VideoModal from "./VideoModal";

function LoginPage({ error, setError, token, setToken, handleConnect, isLoading, accounts, cancelLoading, deleteAccountWithToken }) {
   const [showPassword, setShowPassword] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const { accountHistory } = accounts;

   const defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/1.png';

   return (
      <Fragment>
         <Navbar />

         <div className="app">
            <div className="discord-container">
               <div className="w-fit mx-auto">
                  <img src="logo.png" alt="iMusic Logo" draggable={false} className="w-20 h-20 mx-auto" />
               </div>

               {isLoading ? (
                  <div className="w-fit mx-auto mt-8">
                     <i className="fas fa-spinner fa-spin mr-2 animate-spin"></i>
                     Connexion en cours...
                  </div>
               ) : (
                  <div className="flex flex-col gap-2">
                     <div className="relative flex flex-col">
                        <div className="input-group mt-8">
                           <input
                              type={showPassword ? "text" : "password"}
                              value={token}
                              onChange={(e) => setToken(e.target.value)}
                              placeholder="Token de votre bot discord"
                              className="discord-input w-full pr-12 text-ellipsis"
                           />
                           <i
                              className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} password-toggle text-lg`}
                              onClick={() => setShowPassword(!showPassword)}
                           ></i>
                        </div>

                        <div className="flex gap-2">
                           <button className="discord-button-secondary w-full py-3 text-lg font-semibold" onClick={() => setIsModalOpen(true)}>
                              Voir la vidéo
                           </button>

                           <button className="discord-button w-full py-3 text-lg font-semibold" onClick={() => handleConnect(token)}>
                              Se connecter
                           </button>
                        </div>

                        {error ? (
                           <div className="error-message flex items-center justify-between">
                              <div className="flex">
                                 <i className="fas fa-exclamation-triangle mr-2"></i>
                                 {error}
                              </div>

                              <X className="cursor-pointer" onClick={() => setError(null)} />
                           </div>
                        ) : null}
                     </div>

                     {accountHistory.length > 0 && (
                        <div className="account-history mt-4">
                           <h3 className="text-discord-textMuted font-semibold text-base mb-2">
                              {accountHistory.length}/8 Historique des comptes
                           </h3>
                           <div className="flex flex-row flex-wrap gap-2 overflow-y-auto">
                              {accountHistory.map((acc, index) => (
                                 <div key={index} className="account-item p-2 bg-black/10 rounded-lg">
                                    <div className="relative flex flex-col items-center justify-between gap-2">
                                       <div className="absolute cursor-pointer -top-1 -right-1 text-red-500 hover:text-red-300 text-sm mb-2" onClick={() => deleteAccountWithToken(acc.token)}>
                                          <X className="w-4 h-4" />
                                       </div>

                                       <div className="w-full flex flex-col gap-2 items-center">
                                          <img 
                                             src={acc.avatar || defaultAvatar} 
                                             alt="Avatar" 
                                             className="w-8 h-8 rounded-full"
                                             draggable={false}
                                             onError={(e) => e.target.src = defaultAvatar}
                                          />
                                          <span className="text-discord-text">{acc.name}</span>
                                       </div>

                                       <button className="w-full bg-[#5865f2] text-white text-base py-1 px-2 rounded-lg hover:opacity-70 transition-all" onClick={() => handleConnect(acc.token)}>Se connecter</button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               )}

            </div>
         </div>

         <VideoModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            videoId="rcwWex7aqTo"
         />
      </Fragment>
   )
}

export default LoginPage