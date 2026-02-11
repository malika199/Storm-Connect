import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * Layout pour toutes les pages /user/* : Navbar + contenu.
 * Les filtres globaux sont maintenant affichés uniquement dans la page Match.
 */
const UserLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default UserLayout;
