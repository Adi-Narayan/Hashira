import React from 'react';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

const Footer = () => {
  return (
    <div>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        
        {/* Logo & Description */}
        <div>
          <img src={assets.logo} className="mb-5 w-32" alt="Hashira Logo" />
          <p className="w-full md:w-2/3 text-gray-600">
            Your comfort and confidence are at the heart of everything we do. 
            Enjoy seamless shopping, easy exchanges, and fashion that feels just right—delivered to your doorstep.
          </p>
        </div>

        {/* Navigation Links */}
        <div>
          <p className="text-xl font-medium mb-5">HASHIRA</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>
              <Link to="/" className="hover:text-black transition">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-black transition">
                About us
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-black transition">
                Delivery
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>
              <a href="tel:+916304656252" className="hover:text-black transition">
                +91 6304656252
              </a>
            </li>
            <li>
              <a
                href="mailto:hashiraenterprise@gmail.com"
                className="hover:text-black transition"
              >
                hashiraenterprise@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div>
        <hr />
        <p className="py-5 text-sm text-center">
          Copyright 2025 © hashira.in — All Rights Reserved
        </p>
      </div>
    </div>
  );
};

export default Footer;
