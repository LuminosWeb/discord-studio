import { useEffect } from 'react';
import YouTube from 'react-youtube';
import { X } from 'lucide-react';

function VideoModal({ isOpen, onClose, videoId }) {
   useEffect(() => {
      if (isOpen) {
         document.body.style.overflow = 'hidden';
      } else {
         document.body.style.overflow = 'unset';
      }

      return () => {
         document.body.style.overflow = 'unset';
      };
   }, [isOpen]);

   if (!isOpen) return null;

   return (
      <div className="modal-overlay" onClick={onClose}>
         <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={onClose}>
               <X className="w-6 h-6" />
            </button>
            
            <YouTube 
               videoId={videoId}
               opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                     disablekb: 0,
                     controls: 1,
                     modestbranding: 1,
                     autoplay: 1,
                     playsinline: 1,
                     rel: 0
                  },
               }}
               className="modal-video"
            />
         </div>
      </div>
   );
}

export default VideoModal;
