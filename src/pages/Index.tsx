import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <motion.h1 
            className="text-4xl md:text-5xl font-light bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600"
            animate={{ 
              backgroundPosition: ["0%", "100%"],
              backgroundSize: ["100%", "200%"] 
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Faites passer votre agence à la vitesse supérieure !
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-600 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Avec des fonctionnalités adaptées aux besoins des professionnels de l'immobilier, 
            créez votre compte dès maintenant pour transformer vos prospects en clients.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Button
              onClick={() => navigate("/register")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transform transition duration-200 hover:-translate-y-1"
            >
              Créer mon compte
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;