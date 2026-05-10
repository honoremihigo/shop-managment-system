module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("stocks", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cost_price: {
        type: Sequelize.DECIMAL(10, 1),
        allowNull: false,
      },
      selling_price: {
        type: Sequelize.DECIMAL(10, 1),
        allowNull: false,
      },
      reorder_threshold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("stocks");
  },
};