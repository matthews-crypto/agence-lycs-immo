
import React from 'react';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Connexion</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Votre email"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Mot de passe</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Votre mot de passe"
            />
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
