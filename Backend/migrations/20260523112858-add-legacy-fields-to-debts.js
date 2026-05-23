module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make sale_id nullable
    await queryInterface.changeColumn('debts', 'sale_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Add legacy columns – but first check if they exist
    const tableInfo = await queryInterface.describeTable('debts');

    if (!tableInfo.product_id) {
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
    }

    if (!tableInfo.quantity) {
      await queryInterface.addColumn('debts', 'quantity', {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
      });
    }

    if (!tableInfo.price) {
      await queryInterface.addColumn('debts', 'price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('debts', 'quantity');
    await queryInterface.removeColumn('debts', 'price');
    await queryInterface.removeColumn('debts', 'product_id');

    await queryInterface.changeColumn('debts', 'sale_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  }
};