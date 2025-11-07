import { useEffect, useState } from 'react';

function Navbar({ user, onLogout }) {
   const [menuOpen, setMenuOpen] = useState(false);

   const handleLogout = () => {
      localStorage.removeItem('discord_token');
      if (onLogout && typeof onLogout === 'function') onLogout();
   };

   const copyId = () => {
      try {
         navigator.clipboard.writeText(user.accountId);
         alert(`Vous avez copié l'ID : ${user.accountId.toString()}`);
      } catch (error) {
         alert(`Erreur lors de la copie de l'ID : ${error}`);
      }
   };

   useEffect(() => {
      const handleClickOutside = (event) => {
         if (menuOpen && !event.target.closest('.discord-menu') && !event.target.closest('.discord-avatar')) {
            setMenuOpen(false);
         }
      };

      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
   }, [menuOpen]);

   const randomAvatar = "https://cdn.discordapp.com/embed/avatars/1.png";

   return (
      <div className="navbar sticky w-screen flex items-center justify-between h-12 px-3 select-none z-[1000]">
         <div className="relative flex items-center gap-2">
            <div className="absolute w-full h-full"/>
            <img src="logo.png" alt="Avatar" draggable={false} className="w-8 h-8 rounded-full" />

            <div className="flex flex-col">
               <p className="text-white text-sm font-medium leading-none">Discord Music</p>
               <p className="text-gray-400 text-xs leading-none">v1.0.0</p>
            </div>
         </div>

         <div className="flex-1 navbar-move h-12"></div>

         <div className="flex">
            {user ? (
               <div className="relative flex mr-2">
                  <img
                     src={user.avatar}
                     alt="Avatar"
                     className="discord-avatar w-8 h-8"
                     draggable={false}
                     onClick={() => setMenuOpen(!menuOpen)}
                     onError={(e) => e.target.src = randomAvatar}
                  />

                  <div className={`discord-menu menu ${menuOpen ? 'open' : ''}`}>
                     <div className="discord-menu-item border-b border-discord-textDark pb-2 mb-2">
                        <img 
                           src={user.avatar} 
                           alt="Avatar" 
                           className="w-8 h-8 rounded-full"
                           draggable={false}
                           onError={(e) => e.target.src = randomAvatar}
                        />
                        <div>
                           <div className="font-medium">{user.name}</div>
                           <div className="text-xs text-discord-textMuted">{user.id}</div>
                        </div>
                     </div>

                     <div className="discord-menu-item" onClick={copyId}>
                        <i className="fas fa-copy text-discord-textMuted"></i>
                        <span>Copier ID</span>
                     </div>

                     <div className="discord-menu-item" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt text-red-500/50"></i>
                        <span>Déconnexion</span>
                     </div>
                  </div>
               </div>
            ) : undefined}

            <div className="flex">
               <div className="cursor-pointer" title="Ouvrir le repository Github" onClick={() => window.electronAPI?.openExternal("https://github.com/LuminosWeb/discord-studio")}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24">
                     <path fill="currentColor" 
                        d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
                     />
                  </svg>
               </div>
               <button
                  className="flex items-center justify-center rounded w-8 h-8 text-gray-400 hover:text-white hover:bg-white/20 transition-colors duration-200"
                  onClick={(e) => { e.stopPropagation(); window.electronAPI?.minimize(); }}
               >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 25 25" fill="currentColor">
                     <rect x="5" y="12" width="15" height="2" />
                  </svg>
               </button>

               <button
                  className="flex items-center justify-center rounded w-8 h-8 text-gray-400 hover:text-white hover:bg-white/20 transition-colors duration-200"
                  onClick={(e) => { e.stopPropagation(); window.electronAPI?.maximize(); }}
               >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 25 25" fill="currentColor">
                     <rect x="7" y="7" width="11" height="11" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
               </button>

               <button
                  className="flex items-center justify-center rounded w-8 h-8 text-gray-400 hover:text-white hover:bg-red-600 transition-colors duration-200"
                  onClick={(e) => { e.stopPropagation(); window.electronAPI?.close(); }}
               >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 25 25" fill="currentColor">
                     <line x1="6" y1="6" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
                     <line x1="19" y1="6" x2="6" y2="19" stroke="currentColor" strokeWidth="2" />
                  </svg>
               </button>
            </div>
         </div>
      </div>
   );
};

export default Navbar;