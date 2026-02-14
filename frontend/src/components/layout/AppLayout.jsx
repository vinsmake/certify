// 20.07 - Layout principal: Header + Sidebar + contenido principal + Footer

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const SIDEBAR_WIDTH = '220px';
const HEADER_HEIGHT = '60px';

const AppLayout = () => {
  return (
    <div style={styles.root}>
      <Header />
      <Sidebar />
      <div style={styles.body}>
        <main style={styles.main}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

const styles = {
  root: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-background)',
  },
  body: {
    marginLeft: SIDEBAR_WIDTH,
    marginTop: HEADER_HEIGHT,
    display: 'flex',
    flexDirection: 'column',
    minHeight: `calc(100vh - ${HEADER_HEIGHT})`,
  },
  main: {
    flex: 1,
    padding: '1.75rem 2rem',
    overflowY: 'auto',
  },
};

export default AppLayout;
