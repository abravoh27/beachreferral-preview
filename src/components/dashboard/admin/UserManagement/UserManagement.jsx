'use client';
import React from 'react';
import CreateUserForm from '../CreateUserForm/CreateUserForm';
import AllUsersList from '../AllUsersList/AllUsersList';
import './UserManagement.css';

const UserManagement = () => (
  <div className="user-management">
    <CreateUserForm />
    <AllUsersList />
  </div>
);

export default UserManagement;
