module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make sale_id nullable
    await queryInterface.changeColumn('debts', 'sale_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Add legacy columns
    await queryInterface.addColumn('debts', 'product_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('debts', 'quantity', {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: true,
    });

    await queryInterface.addColumn('debts', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('debts', 'quantity');
    await queryInterface.removeColumn('debts', 'price');
    await queryInterface.removeColumn('debts', 'product_id');

    // Revert sale_id to NOT NULL
    await queryInterface.changeColumn('debts', 'sale_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  }
};