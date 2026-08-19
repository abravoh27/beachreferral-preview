'use client'; import React from 'react'; import './Card.css';
const Card = ({ children, title, headerAction }) => (<div className="card">{title && <div className="card__header"><h3>{title}</h3>{headerAction && <div className="card__header-action">{headerAction}</div>}</div>}<div className="card__body">{children}</div></div>); export default Card;
